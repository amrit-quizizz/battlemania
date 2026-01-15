import type { Player } from "../types";
import type { AppDispatch } from "../../store/store";
import { startGame as startGameAction } from "../../store/gameSlice";

const startGame = (
  { players, initialPoints }: { players: Player[]; initialPoints?: Record<string, number> },
  dispatch: AppDispatch,
  gameId?: string
) => {
  const generatedGameId = gameId || `GAME_${Date.now()}`;
  const playerIds = players.map(player => player.id);

  dispatch(startGameAction({ gameId: generatedGameId, playerIds, initialPoints }));

  console.log(`Game ${generatedGameId} started with ${players.length} players`);

  return generatedGameId;
}

export default startGame;
