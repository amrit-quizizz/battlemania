import type { AppDispatch } from "../../store/store";
import { updateDamage, incrementTurn, recordTurn } from "../../store/gameSlice";
import { getAmmunitionDetails } from "../data/ammunition";

export interface PlayerAction {
  playerId: string;
  ammunitionId: string;
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
    const toPlayer = playerIds[1 - index]; // Opponent is the other player
    const ammoDetails = getAmmunitionDetails(action.ammunitionId);

    if (!ammoDetails) {
      throw new Error(`Invalid ammunition ID: ${action.ammunitionId}`);
    }

    const damage = ammoDetails.damage;

    // Update attacker's total damage dealt
    dispatch(updateDamage({
      gameId,
      playerId: fromPlayer,
      damage,
    }));

    damages.push({
      fromPlayer,
      toPlayer,
      damage,
      ammunitionId: action.ammunitionId,
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
