function Platform() {
  return (
    <>
      {/* Main platform - much larger for bigger tanks */}
      <mesh receiveShadow position={[0, -1, 0]}>
        <boxGeometry args={[60, 2, 60]} />
        <meshStandardMaterial color="#8B7355" />
      </mesh>

      {/* Elevated platforms for 2.5D effect - scaled up */}
      <mesh receiveShadow castShadow position={[-20, 1.5, -20]}>
        <boxGeometry args={[12, 5, 12]} />
        <meshStandardMaterial color="#A0826D" />
      </mesh>

      <mesh receiveShadow castShadow position={[20, 1.5, -20]}>
        <boxGeometry args={[12, 5, 12]} />
        <meshStandardMaterial color="#A0826D" />
      </mesh>

      <mesh receiveShadow castShadow position={[-20, 1.5, 20]}>
        <boxGeometry args={[12, 5, 12]} />
        <meshStandardMaterial color="#A0826D" />
      </mesh>

      <mesh receiveShadow castShadow position={[20, 1.5, 20]}>
        <boxGeometry args={[12, 5, 12]} />
        <meshStandardMaterial color="#A0826D" />
      </mesh>

      {/* Central obstacle - larger */}
      <mesh receiveShadow castShadow position={[0, 2, 0]}>
        <boxGeometry args={[8, 6, 8]} />
        <meshStandardMaterial color="#696969" />
      </mesh>

      {/* Additional cover objects */}
      <mesh receiveShadow castShadow position={[-10, 1, 0]}>
        <boxGeometry args={[4, 4, 4]} />
        <meshStandardMaterial color="#7A7A7A" />
      </mesh>

      <mesh receiveShadow castShadow position={[10, 1, 0]}>
        <boxGeometry args={[4, 4, 4]} />
        <meshStandardMaterial color="#7A7A7A" />
      </mesh>

      {/* Side walls for boundaries - scaled up */}
      <mesh receiveShadow castShadow position={[-31, 5, 0]}>
        <boxGeometry args={[2, 12, 62]} />
        <meshStandardMaterial color="#505050" />
      </mesh>

      <mesh receiveShadow castShadow position={[31, 5, 0]}>
        <boxGeometry args={[2, 12, 62]} />
        <meshStandardMaterial color="#505050" />
      </mesh>

      <mesh receiveShadow castShadow position={[0, 5, -31]}>
        <boxGeometry args={[62, 12, 2]} />
        <meshStandardMaterial color="#505050" />
      </mesh>

      <mesh receiveShadow castShadow position={[0, 5, 31]}>
        <boxGeometry args={[62, 12, 2]} />
        <meshStandardMaterial color="#505050" />
      </mesh>
    </>
  )
}

export default Platform