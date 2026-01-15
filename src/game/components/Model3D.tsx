import { useGLTF } from '@react-three/drei'
import { Group } from 'three'
import { useRef, useEffect } from 'react'

interface Model3DProps {
  url: string
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: number | [number, number, number]
  castShadow?: boolean
  receiveShadow?: boolean
}

function Model3D({
  url,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  castShadow = true,
  receiveShadow = true
}: Model3DProps) {
  const groupRef = useRef<Group>(null)
  const { scene } = useGLTF(url)

  useEffect(() => {
    // Enable shadows for all meshes in the model
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = castShadow
        child.receiveShadow = receiveShadow
      }
    })
  }, [scene, castShadow, receiveShadow])

  const scaleArray = typeof scale === 'number' ? [scale, scale, scale] : scale

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      <primitive object={scene} scale={scaleArray} />
    </group>
  )
}

// Preload models to avoid loading delays
export function preloadModel(url: string) {
  useGLTF.preload(url)
}

export default Model3D