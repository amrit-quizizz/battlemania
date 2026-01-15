import { useRef, useState } from 'react';
import { Group } from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Unit } from '../types/game';
import { useGameStore } from '../store/gameStore';

interface ArtilleryProps {
  unit: Unit;
}

export function Artillery({ unit }: ArtilleryProps) {
  const groupRef = useRef<Group>(null);
  const barrelRef = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  const selectedUnit = useGameStore((state) => state.selectedUnit);
  const selectUnit = useGameStore((state) => state.selectUnit);

  const isSelected = selectedUnit === unit.id;
  const teamColor = unit.team === 'red' ? '#cc0000' : '#0066cc';
  const bodyColor = unit.team === 'red' ? '#660000' : '#000066';

  useFrame(({ clock }) => {
    if (!groupRef.current || !barrelRef.current) return;

    const time = clock.getElapsedTime();

    // Idle animation
    if (unit.command === 'idle') {
      groupRef.current.position.y = unit.position.y + Math.sin(time * 1.5) * 0.01;
    }

    // Fire animation - barrel recoil
    if (unit.command === 'fire') {
      barrelRef.current.rotation.x = -0.3 + Math.sin(time * 15) * 0.1;
      groupRef.current.position.y = unit.position.y + Math.abs(Math.sin(time * 10)) * 0.08;
    } else {
      barrelRef.current.rotation.x = -0.3;
    }

    // Attack - barrel aims higher
    if (unit.command === 'attack') {
      barrelRef.current.rotation.x = -0.5 + Math.sin(time * 2) * 0.05;
    }

    // Defend - barrel aims lower
    if (unit.command === 'defend') {
      barrelRef.current.rotation.x = -0.1;
      groupRef.current.position.y = unit.position.y - 0.05;
    }
  });

  const healthPercent = unit.health / unit.maxHealth;

  return (
    <group
      ref={groupRef}
      position={[unit.position.x, unit.position.y, unit.position.z]}
      rotation={[0, unit.rotation, 0]}
      onClick={(e) => {
        e.stopPropagation();
        selectUnit(unit.id);
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Base platform */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.6, 0.7, 0.3, 8]} />
        <meshStandardMaterial
          color={bodyColor}
          emissive={isSelected || hovered ? teamColor : '#000'}
          emissiveIntensity={isSelected ? 0.5 : hovered ? 0.3 : 0}
        />
      </mesh>

      {/* Wheels */}
      {[-0.5, 0.5].map((z, i) => (
        <mesh key={i} position={[-0.4, -0.1, z]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.25, 0.25, 0.1, 16]} />
          <meshStandardMaterial color="#333" />
        </mesh>
      ))}

      {/* Main body */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[0.8, 0.4, 0.6]} />
        <meshStandardMaterial color={teamColor} />
      </mesh>

      {/* Barrel mount */}
      <group ref={barrelRef} position={[0.2, 0.5, 0]}>
        {/* Barrel housing */}
        <mesh castShadow>
          <boxGeometry args={[0.4, 0.3, 0.35]} />
          <meshStandardMaterial color="#444" />
        </mesh>

        {/* Main barrel */}
        <mesh position={[0.6, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.1, 0.12, 1.2, 8]} />
          <meshStandardMaterial color="#222" />
        </mesh>

        {/* Barrel tip */}
        <mesh position={[1.1, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.08, 0.1, 0.2, 8]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      </group>

      {/* Selection ring */}
      {isSelected && (
        <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.9, 1, 32]} />
          <meshBasicMaterial color={teamColor} transparent opacity={0.8} />
        </mesh>
      )}

      {/* Health bar and info */}
      <Html position={[0, 1.4, 0]} center distanceFactor={15}>
        <div className="flex flex-col items-center pointer-events-none">
          <div className="w-16 h-2 bg-gray-800 rounded-full overflow-hidden border border-gray-600">
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${healthPercent * 100}%`,
                backgroundColor: healthPercent > 0.5 ? '#22c55e' : healthPercent > 0.25 ? '#eab308' : '#ef4444',
              }}
            />
          </div>
          <div
            className="text-xs font-bold mt-1 px-2 py-0.5 rounded"
            style={{
              backgroundColor: unit.team === 'red' ? 'rgba(139, 0, 0, 0.8)' : 'rgba(0, 0, 139, 0.8)',
              color: 'white',
            }}
          >
            ARTILLERY
          </div>
        </div>
      </Html>
    </group>
  );
}
