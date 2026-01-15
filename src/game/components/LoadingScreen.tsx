import { Html, useProgress } from '@react-three/drei'

function LoadingScreen() {
  const { active, progress, errors, item, loaded, total } = useProgress()

  return (
    <Html center>
      <div
        style={{
          width: '300px',
          padding: '20px',
          background: 'rgba(0, 0, 0, 0.8)',
          borderRadius: '10px',
          border: '2px solid #00ff00',
          textAlign: 'center',
          color: 'white',
          fontFamily: 'monospace'
        }}
      >
        <h2 style={{ margin: '0 0 20px 0', color: '#00ff00' }}>Battle Mania</h2>
        <div style={{ marginBottom: '10px' }}>Loading Assets...</div>

        {/* Progress bar */}
        <div
          style={{
            width: '100%',
            height: '20px',
            background: '#333',
            borderRadius: '10px',
            overflow: 'hidden',
            marginBottom: '10px'
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #00ff00, #00aa00)',
              borderRadius: '10px',
              transition: 'width 0.3s ease'
            }}
          />
        </div>

        <div style={{ fontSize: '14px' }}>
          {Math.round(progress)}% ({loaded} / {total})
        </div>

        {item && (
          <div style={{ fontSize: '12px', marginTop: '10px', color: '#888' }}>
            Loading: {item}
          </div>
        )}

        {errors.length > 0 && (
          <div style={{ color: '#ff4444', fontSize: '12px', marginTop: '10px' }}>
            Error loading some assets
          </div>
        )}
      </div>
    </Html>
  )
}

export default LoadingScreen