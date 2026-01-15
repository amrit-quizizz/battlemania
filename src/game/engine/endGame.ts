import type { AppDispatch } from "../../store/store";
import { endGame as endGameAction } from "../../store/gameSlice";
import type { GameInstance } from "../../store/gameSlice";

export interface EndGameResult {
  winner: string;
  reason: 'damage' | 'turns_completed';
  stats: {
    playerId: string;
    totalDamageDealt: number;
  }[];
}

const endGame = (
  game: GameInstance,
  dispatch: AppDispatch
): EndGameResult => {
  // Determine winner based on highest damage dealt
  const sortedPlayers = [...game.players].sort(
    (a, b) => b.totalDamageDealt - a.totalDamageDealt
  );

  const winner = sortedPlayers[0];
  const reason: 'damage' | 'turns_completed' = 'turns_completed';

  // Dispatch endGame action to Redux
  dispatch(endGameAction({
    gameId: game.gameId,
    winner: winner.playerId,
  }));

  console.log(`Game ${game.gameId} ended. Winner: ${winner.playerId}`);

  return {
    winner: winner.playerId,
    reason,
    stats: game.players.map(p => ({
      playerId: p.playerId,
      totalDamageDealt: p.totalDamageDealt,
    })),
  };
};

export default endGame;
