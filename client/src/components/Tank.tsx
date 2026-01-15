import { useRef, useState } from 'react';
import { Mesh, Group } from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Unit } from '../types/game';
import { useGameStore } from '../store/gameStore';

interface TankProps {
  unit: Unit;
}

export function Tank({ unit }: TankProps) {
  const groupRef = useRef<Group>(null);
  const turretRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const selectedUnit = useGameStore((state) => state.selectedUnit);
  const selectUnit = useGameStore((state) => state.selectUnit);

  const isSelected = selectedUnit === unit.id;
  const teamColor = unit.team === 'red' ? '#cc0000' : '#0066cc';
  const bodyColor = unit.team === 'red' ? '#8b0000' : '#00008b';

  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    const time = clock.getElapsedTime();

    // Idle animation - slight hover
    if (unit.command === 'idle') {
      groupRef.current.position.y = unit.position.y + Math.sin(time * 2) * 0.02;
    }

    // Attack animation - move toward center
    if (unit.command === 'attack') {
      const targetX = unit.team === 'red' ? unit.position.x + 0.5 : unit.position.x - 0.5;
      groupRef.current.position.x += (targetX - groupRef.current.position.x) * 0.02;
      groupRef.current.position.y = unit.position.y + Math.abs(Math.sin(time * 4)) * 0.1;
    }

    // Defend animation - hunker down
    if (unit.command === 'defend') {
      groupRef.current.position.y = unit.position.y - 0.1 + Math.sin(time * 3) * 0.01;
    }

    // Fire animation - recoil
    if (unit.command === 'fire') {
      groupRef.current.position.y = unit.position.y + Math.sin(time * 8) * 0.05;
      if (turretRef.current) {
        turretRef.current.rotation.y = Math.sin(time * 10) * 0.1;
      }
    }

    // Rotate turret toward enemy side
    if (turretRef.current) {
      const targetRotation = unit.team === 'red' ? 0 : Math.PI;
      turretRef.current.rotation.y += (targetRotation - turretRef.current.rotation.y) * 0.05;
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
      {/* Tank body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.4, 0.8]} />
        <meshStandardMaterial
          color={bodyColor}
          emissive={isSelected || hovered ? teamColor : '#000'}
          emissiveIntensity={isSelected ? 0.5 : hovered ? 0.3 : 0}
        />
      </mesh>

      {/* Tank tracks - left */}
      <mesh position={[0, -0.15, 0.45]} castShadow>
        <boxGeometry args={[1.3, 0.2, 0.15]} />
        <meshStandardMaterial color="#333" />
      </mesh>

      {/* Tank tracks - right */}
      <mesh position={[0, -0.15, -0.45]} castShadow>
        <boxGeometry args={[1.3, 0.2, 0.15]} />
        <meshStandardMaterial color="#333" />
      </mesh>

      {/* Turret base */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.4, 0.3, 8]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>

      {/* Turret and barrel */}
      <group ref={turretRef} position={[0, 0.5, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.5, 0.25, 0.4]} />
          <meshStandardMaterial color={teamColor} />
        </mesh>

        {/* Barrel */}
        <mesh position={[0.5, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.06, 0.08, 0.8, 8]} />
          <meshStandardMaterial color="#333" />
        </mesh>
      </group>

      {/* Selection ring */}
      {isSelected && (
        <mesh position={[0, -0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.8, 0.9, 32]} />
          <meshBasicMaterial color={teamColor} transparent opacity={0.8} />
        </mesh>
      )}

      {/* Health bar and info */}
      <Html position={[0, 1.2, 0]} center distanceFactor={15}>
        <div className="flex flex-col items-center pointer-events-none">
          {/* Health bar */}
          <div className="w-16 h-2 bg-gray-800 rounded-full overflow-hidden border border-gray-600">
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${healthPercent * 100}%`,
                backgroundColor: healthPercent > 0.5 ? '#22c55e' : healthPercent > 0.25 ? '#eab308' : '#ef4444',
              }}
            />
          </div>
          {/* Unit info */}
          <div
            className="text-xs font-bold mt-1 px-2 py-0.5 rounded"
            style={{
              backgroundColor: unit.team === 'red' ? 'rgba(139, 0, 0, 0.8)' : 'rgba(0, 0, 139, 0.8)',
              color: 'white',
            }}
          >
            {unit.command.toUpperCase()}
          </div>
        </div>
      </Html>
    </group>
  );
}
