// Asset paths configuration
// Update these paths once the models are extracted

export const ASSET_PATHS = {
  models: {
    // Tank models - update these paths after extraction
    tank: {
      player1: '/src/3d-game/assets/3d models/tank/tank.glb', // Update with actual path
      player2: '/src/3d-game/assets/3d models/tank/tank.glb', // Can use same model
    },

    // Environment models
    environment: {
      tree: '/src/3d-game/assets/3d models/tree.glb',
      rock: '/src/3d-game/assets/3d models/rock.glb',
      building: '/src/3d-game/assets/3d models/building.glb',
      barrel: '/src/3d-game/assets/3d models/barrel.glb',
      crate: '/src/3d-game/assets/3d models/crate.glb',
    },

    // Effects
    effects: {
      explosion: '/src/3d-game/assets/3d models/explosion.glb',
      muzzleFlash: '/src/3d-game/assets/3d models/muzzle_flash.glb',
    }
  },

  textures: {
    ground: {
      grass: '/src/3d-game/assets/textures/grass.jpg',
      dirt: '/src/3d-game/assets/textures/dirt.jpg',
      sand: '/src/3d-game/assets/textures/sand.jpg',
      concrete: '/src/3d-game/assets/textures/concrete.jpg',
    }
  },

  sounds: {
    fire: '/src/3d-game/assets/sounds/fire.mp3',
    explosion: '/src/3d-game/assets/sounds/explosion.mp3',
    hit: '/src/3d-game/assets/sounds/hit.mp3',
  }
}

// Helper function to check if asset exists
export async function checkAssetExists(path: string): Promise<boolean> {
  try {
    const response = await fetch(path, { method: 'HEAD' })
    return response.ok
  } catch {
    return false
  }
}

// Get available assets
export async function getAvailableAssets() {
  const available: Record<string, boolean> = {}

  for (const [category, paths] of Object.entries(ASSET_PATHS.models)) {
    for (const [name, path] of Object.entries(paths as any)) {
      const key = `${category}.${name}`
      available[key] = await checkAssetExists(path)
    }
  }

  return available
}