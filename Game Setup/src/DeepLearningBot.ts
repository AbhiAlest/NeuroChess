import * as tf from "@tensorflow/tfjs";
import { ChessInstance } from "chess.js";

// saved model
const model = await tf.loadLayersModel("path/to/model.json"); //not done

export const predictBestMove = (chess: ChessInstance) => {
  const moves = chess.moves();
  let bestMove: string | null = null;
  let bestScore = -Infinity;

  for (let i = 0; i < moves.length; i++) {
    const move = moves[i];
    const moveResult = chess.move(move);
    if (moveResult !== null) {
      const input = preprocessInput(chess);
      const output = model.predict(input);
      const score = output.dataSync()[0];
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
      chess.undo();
    }
  }

  return bestMove as string;
};

const preprocessInput = (chess: ChessInstance) => {
  const board = chess.board();
  const input = tf.tensor(board.flat()).reshape([1, 8, 8, 1]).div(12);
  return input;
};
