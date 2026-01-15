import { useRef, useEffect } from 'react'
import { Mesh } from 'three'
import { bulletConfig, visualEffectsConfig } from '../config/gameConfig'

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
      <sphereGeometry args={bulletConfig.geometrySizes.standard} />
      <meshStandardMaterial
        color={bulletConfig.materialColor}
        emissive={bulletConfig.materialEmissive}
        emissiveIntensity={bulletConfig.materialEmissiveIntensity}
        metalness={visualEffectsConfig.materials.metalness}
        roughness={visualEffectsConfig.materials.roughness}
      />
    </mesh>
  )
}

export default Bullet