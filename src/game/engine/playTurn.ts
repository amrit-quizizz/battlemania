import type { AppDispatch } from "../../store/store";
import { updateDamage, takeDamage, incrementTurn, recordTurn } from "../../store/gameSlice";
import { getAmmunitionDetails } from "../data/ammunition";
import { getWallDetails } from "../data/walls";

export interface PlayerAction {
  playerId: string;
  ammunitionId: string | null;
  wallId?: string | null;
}

export interface PlayTurnRequest {
  turnNumber: number;
  actions: PlayerAction[];
}

export interface TurnResult {
  success: boolean;
  damages: Array<{
    fromPlayer: string;
    toPlayer: string;
    damage: number;
    ammunitionId: string;
    defendedBy?: number;
  }>;
}

const playTurn = (
  gameId: string,
  request: PlayTurnRequest,
  dispatch: AppDispatch
): TurnResult => {
  const { actions } = request;

  // Validate: Both players must submit exactly one action
  if (actions.length !== 2) {
    throw new Error('Both players must submit exactly one action');
  }

  // Validate: Each action must be from a different player
  const playerIds = actions.map(a => a.playerId);
  if (playerIds[0] === playerIds[1]) {
    throw new Error('Actions must be from different players');
  }

  const damages: TurnResult['damages'] = [];

  // Process each action - player attacks the opponent
  actions.forEach((action, index) => {
    const fromPlayer = action.playerId;
    const opponentAction = actions[1 - index]; // Get opponent's action
    const toPlayer = opponentAction.playerId;

    // Get ammunition details (null means "No Attack" - 0 damage)
    const ammoDetails = action.ammunitionId ? getAmmunitionDetails(action.ammunitionId) : null;

    if (action.ammunitionId && !ammoDetails) {
      throw new Error(`Invalid ammunition ID: ${action.ammunitionId}`);
    }

    const rawDamage = ammoDetails?.damage || 0;

    // Get opponent's wall defense
    const opponentWall = opponentAction.wallId ? getWallDetails(opponentAction.wallId) : null;
    const wallDefense = opponentWall?.defense || 0;

    // Calculate actual damage after wall absorption
    const actualDamage = Math.max(0, rawDamage - wallDefense);

    // Apply damage to the opponent's health and track attacker's stats
    if (actualDamage > 0) {
      // Reduce opponent's health
      dispatch(takeDamage({
        gameId,
        playerId: toPlayer,
        damage: actualDamage,
      }));

      // Track attacker's total damage dealt for stats
      dispatch(updateDamage({
        gameId,
        playerId: fromPlayer,
        damage: actualDamage,
      }));
    }

    damages.push({
      fromPlayer,
      toPlayer,
      damage: actualDamage,
      ammunitionId: action.ammunitionId || '',
      defendedBy: wallDefense,
    });
  });

  // Record turn in history
  dispatch(recordTurn({
    gameId,
    turnRecord: {
      turnNumber: request.turnNumber,
      actions,
      damages,
      timestamp: Date.now(),
    },
  }));

  // Increment turn
  dispatch(incrementTurn(gameId));

  console.log(`Turn ${request.turnNumber} completed for game ${gameId}`, damages);

  return {
    success: true,
    damages,
  };
};

export default playTurn;
