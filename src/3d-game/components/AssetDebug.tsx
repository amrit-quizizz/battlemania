import { useEffect, useState } from 'react'

function AssetDebug() {
  const [assets, setAssets] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAssets()
  }, [])

  const checkAssets = async () => {
    setLoading(true)
    try {
      // Check what files exist in the 3d models directory
      const basePath = '/src/3d-game/assets/3d models/'
      const possibleFiles = [
        'tank.glb',
        'tank.gltf',
        'tank.fbx',
        'tank.obj',
        'tank/tank.glb',
        'tank/tank.gltf',
        'tank/model.glb',
        'tank/model.gltf',
      ]

      const found: string[] = []

      for (const file of possibleFiles) {
        try {
          const response = await fetch(basePath + file, { method: 'HEAD' })
          if (response.ok) {
            found.push(basePath + file)
          }
        } catch (e) {
          // File doesn't exist
        }
      }

      setAssets(found)
    } catch (error) {
      console.error('Error checking assets:', error)
    }
    setLoading(false)
  }

  return (
    <div style={{
      position: 'absolute',
      bottom: '20px',
      left: '20px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      fontFamily: 'monospace',
      maxWidth: '300px'
    }}>
      <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>
        Asset Debug Info:
      </div>
      {loading ? (
        <div>Checking for 3D models...</div>
      ) : (
        <>
          {assets.length > 0 ? (
            <div>
              <div style={{ color: '#00ff00' }}>✓ Found models:</div>
              {assets.map((path, i) => (
                <div key={i} style={{ marginLeft: '10px', fontSize: '11px' }}>
                  {path}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: '#ffaa00' }}>
              ⚠ No 3D models found yet
              <br />
              <span style={{ fontSize: '11px' }}>
                Extract tank.rar in src/3d-game/assets/3d models/
              </span>
            </div>
          )}
        </>
      )}
      <button
        onClick={checkAssets}
        style={{
          marginTop: '10px',
          padding: '5px 10px',
          fontSize: '11px',
          cursor: 'pointer'
        }}
      >
        Refresh
      </button>
    </div>
  )
}

export default AssetDebug