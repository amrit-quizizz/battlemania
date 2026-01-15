import { useRef } from 'react';
import { Mesh, DoubleSide } from 'three';
import { useFrame } from '@react-three/fiber';

export function Terrain() {
  return (
    <group>
      {/* Main ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 25]} />
        <meshStandardMaterial color="#2d5a27" side={DoubleSide} />
      </mesh>

      {/* Grid overlay for tactical feel */}
      <gridHelper args={[40, 40, '#1a3d14', '#1a3d14']} position={[0, 0.01, 0]} />

      {/* Left team base area */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-12, 0.02, 0]} receiveShadow>
        <planeGeometry args={[8, 20]} />
        <meshStandardMaterial color="#8b0000" opacity={0.3} transparent />
      </mesh>

      {/* Right team base area */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[12, 0.02, 0]} receiveShadow>
        <planeGeometry args={[8, 20]} />
        <meshStandardMaterial color="#00008b" opacity={0.3} transparent />
      </mesh>

      {/* Decorative elements - rocks/obstacles */}
      <Obstacle position={[-2, 0.3, -4]} scale={0.6} />
      <Obstacle position={[3, 0.4, 2]} scale={0.8} />
      <Obstacle position={[0, 0.35, -6]} scale={0.5} />
      <Obstacle position={[-1, 0.25, 5]} scale={0.4} />
      <Obstacle position={[2, 0.3, -2]} scale={0.5} />

      {/* Trees/bushes for decoration */}
      <Tree position={[-5, 0, -8]} />
      <Tree position={[5, 0, -8]} />
      <Tree position={[-5, 0, 8]} />
      <Tree position={[5, 0, 8]} />
      <Tree position={[0, 0, -10]} />
      <Tree position={[0, 0, 10]} />

      {/* Bunkers */}
      <Bunker position={[-14, 0, -5]} team="red" />
      <Bunker position={[-14, 0, 5]} team="red" />
      <Bunker position={[14, 0, -5]} team="blue" />
      <Bunker position={[14, 0, 5]} team="blue" />
    </group>
  );
}

function Obstacle({ position, scale }: { position: [number, number, number]; scale: number }) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <dodecahedronGeometry args={[scale, 0]} />
      <meshStandardMaterial color="#5a5a5a" roughness={0.9} />
    </mesh>
  );
}

function Tree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Trunk */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, 1, 8]} />
        <meshStandardMaterial color="#4a3728" />
      </mesh>
      {/* Foliage */}
      <mesh position={[0, 1.3, 0]} castShadow>
        <coneGeometry args={[0.8, 1.5, 8]} />
        <meshStandardMaterial color="#1a4d1a" />
      </mesh>
      <mesh position={[0, 2, 0]} castShadow>
        <coneGeometry args={[0.6, 1.2, 8]} />
        <meshStandardMaterial color="#1f5c1f" />
      </mesh>
    </group>
  );
}

function Bunker({ position, team }: { position: [number, number, number]; team: 'red' | 'blue' }) {
  const color = team === 'red' ? '#8b4513' : '#4a5568';

  return (
    <group position={position}>
      {/* Main structure */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[2, 1, 2]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Roof */}
      <mesh position={[0, 1.1, 0]} castShadow>
        <boxGeometry args={[2.2, 0.2, 2.2]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      {/* Flag */}
      <mesh position={[0.8, 1.8, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 1.2, 8]} />
        <meshStandardMaterial color="#888" />
      </mesh>
      <mesh position={[0.8, 2.2, 0.2]}>
        <planeGeometry args={[0.5, 0.3]} />
        <meshStandardMaterial color={team === 'red' ? '#ff0000' : '#0066ff'} side={DoubleSide} />
      </mesh>
    </group>
  );
}

export function AnimatedGround() {
  const meshRef = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      // Subtle wave animation on the ground
      const time = clock.getElapsedTime();
      meshRef.current.position.y = Math.sin(time * 0.5) * 0.01;
    }
  });

  return null;
}
