import type { AppDispatch } from "../../store/store";
import { resetGame as resetGameAction } from "../../store/gameSlice";

/**
 * Reset the current game
 * Clears the current game state from Redux
 */
const resetGame = (dispatch: AppDispatch): void => {
  dispatch(resetGameAction());
  console.log('Game reset');
};

export default resetGame;
