import { useRef, useEffect } from 'react';
import { Group, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import { Trail } from '@react-three/drei';
import { Missile as MissileType } from '../types/game';
import { useGameStore } from '../store/gameStore';

interface MissileProps {
  missile: MissileType;
}

export function Missile({ missile }: MissileProps) {
  const groupRef = useRef<Group>(null);
  const removeMissile = useGameStore((state) => state.removeMissile);
  const damageUnit = useGameStore((state) => state.damageUnit);
  const updateMissile = useGameStore((state) => state.updateMissile);

  const teamColor = missile.team === 'red' ? '#ff4444' : '#4488ff';

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Update progress
    const newProgress = missile.progress + delta * 2; // Speed factor

    if (newProgress >= 1) {
      // Hit target
      damageUnit(missile.toUnit, missile.damage);
      removeMissile(missile.id);
      return;
    }

    updateMissile(missile.id, { progress: newProgress });

    // Parabolic trajectory
    const start = new Vector3(missile.position.x, missile.position.y, missile.position.z);
    const end = new Vector3(missile.targetPosition.x, missile.targetPosition.y, missile.targetPosition.z);

    const current = new Vector3().lerpVectors(start, end, newProgress);
    // Add arc height
    const arcHeight = Math.sin(newProgress * Math.PI) * 3;
    current.y += arcHeight;

    groupRef.current.position.copy(current);

    // Rotate to face direction of travel
    const nextProgress = Math.min(newProgress + 0.01, 1);
    const next = new Vector3().lerpVectors(start, end, nextProgress);
    next.y += Math.sin(nextProgress * Math.PI) * 3;
    groupRef.current.lookAt(next);
  });

  return (
    <group ref={groupRef} position={[missile.position.x, missile.position.y + 0.5, missile.position.z]}>
      <Trail
        width={0.5}
        length={8}
        color={teamColor}
        attenuation={(t) => t * t}
      >
        {/* Missile body */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.1, 0.4, 8]} />
          <meshStandardMaterial
            color={teamColor}
            emissive={teamColor}
            emissiveIntensity={0.8}
          />
        </mesh>
      </Trail>

      {/* Glow effect */}
      <pointLight color={teamColor} intensity={2} distance={3} />
    </group>
  );
}

// Explosion effect when missile hits
export function Explosion({ position, onComplete }: { position: [number, number, number]; onComplete: () => void }) {
  const groupRef = useRef<Group>(null);
  const startTime = useRef(Date.now());

  useFrame(() => {
    if (!groupRef.current) return;

    const elapsed = (Date.now() - startTime.current) / 1000;

    if (elapsed > 0.5) {
      onComplete();
      return;
    }

    // Expand and fade
    const scale = 1 + elapsed * 4;
    groupRef.current.scale.setScalar(scale);
  });

  useEffect(() => {
    const timeout = setTimeout(onComplete, 500);
    return () => clearTimeout(timeout);
  }, [onComplete]);

  return (
    <group ref={groupRef} position={position}>
      <mesh>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial color="#ff8800" transparent opacity={0.8} />
      </mesh>
      <pointLight color="#ff4400" intensity={10} distance={5} />
    </group>
  );
}
