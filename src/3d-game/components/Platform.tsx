import { environmentConfig } from '../config/gameConfig'

function Platform() {
  const { platform, boundaries } = environmentConfig
  
  return (
    <>
      {/* Main platform - much larger for bigger tanks */}
      <mesh receiveShadow position={platform.mainPosition}>
        <boxGeometry args={platform.mainSize} />
        <meshStandardMaterial color={platform.mainColor} />
      </mesh>

      {/* Elevated platforms for 2.5D effect - scaled up */}
      <mesh receiveShadow castShadow position={[-20, platform.elevatedHeight, -20]}>
        <boxGeometry args={platform.elevatedSize} />
        <meshStandardMaterial color={platform.colors.elevated} />
      </mesh>

      <mesh receiveShadow castShadow position={[20, platform.elevatedHeight, -20]}>
        <boxGeometry args={platform.elevatedSize} />
        <meshStandardMaterial color={platform.colors.elevated} />
      </mesh>

      <mesh receiveShadow castShadow position={[-20, platform.elevatedHeight, 20]}>
        <boxGeometry args={platform.elevatedSize} />
        <meshStandardMaterial color={platform.colors.elevated} />
      </mesh>

      <mesh receiveShadow castShadow position={[20, platform.elevatedHeight, 20]}>
        <boxGeometry args={platform.elevatedSize} />
        <meshStandardMaterial color={platform.colors.elevated} />
      </mesh>

      {/* Central obstacle - larger */}
      <mesh receiveShadow castShadow position={[0, platform.obstacleHeight, 0]}>
        <boxGeometry args={platform.obstacleSize} />
        <meshStandardMaterial color={platform.colors.obstacle} />
      </mesh>

      {/* Additional cover objects */}
      <mesh receiveShadow castShadow position={[-10, platform.coverHeight, 0]}>
        <boxGeometry args={platform.coverSize} />
        <meshStandardMaterial color={platform.colors.cover} />
      </mesh>

      <mesh receiveShadow castShadow position={[10, platform.coverHeight, 0]}>
        <boxGeometry args={platform.coverSize} />
        <meshStandardMaterial color={platform.colors.cover} />
      </mesh>

      {/* Side walls for boundaries - scaled up */}
      <mesh receiveShadow castShadow position={[boundaries.leftX, boundaries.height / 2, 0]}>
        <boxGeometry args={[boundaries.thickness, boundaries.height, boundaries.wallDepth]} />
        <meshStandardMaterial color={boundaries.color} />
      </mesh>

      <mesh receiveShadow castShadow position={[boundaries.rightX, boundaries.height / 2, 0]}>
        <boxGeometry args={[boundaries.thickness, boundaries.height, boundaries.wallDepth]} />
        <meshStandardMaterial color={boundaries.color} />
      </mesh>

      <mesh receiveShadow castShadow position={[0, boundaries.height / 2, boundaries.frontZ]}>
        <boxGeometry args={[boundaries.wallWidth, boundaries.height, boundaries.thickness]} />
        <meshStandardMaterial color={boundaries.color} />
      </mesh>

      <mesh receiveShadow castShadow position={[0, boundaries.height / 2, boundaries.backZ]}>
        <boxGeometry args={[boundaries.wallWidth, boundaries.height, boundaries.thickness]} />
        <meshStandardMaterial color={boundaries.color} />
      </mesh>
    </>
  )
}

export default Platform