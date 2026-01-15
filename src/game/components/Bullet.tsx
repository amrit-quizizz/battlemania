import { useRef, useEffect } from 'react'
import { Mesh } from 'three'

interface BulletProps {
  position: [number, number, number]
}

function Bullet({ position }: BulletProps) {
  const meshRef = useRef<Mesh>(null)

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.position.set(...position)
    }
  })

  return (
    <mesh ref={meshRef} castShadow>
      <sphereGeometry args={[0.2, 8, 8]} />
      <meshStandardMaterial
        color="#ffaa00"
        emissive="#ff6600"
        emissiveIntensity={0.8}
        metalness={0.8}
        roughness={0.2}
      />
    </mesh>
  )
}

export default Bullet