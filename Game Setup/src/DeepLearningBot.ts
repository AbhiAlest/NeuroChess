import * as tf from "@tensorflow/tfjs";
import { ChessInstance } from "chess.js";

const model = await tf.loadLayersModel("path/to/model.json"); //replace with json path

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

const preprocessInput = (
  chess: ChessInstance
): tf.Tensor<tf.Rank.R4> => {
  const gameData = chessToGameData(chess);
  const gameDataTensor = tf.tensor4d(gameData, [1, 8, 8, 13]);
  return gameDataTensor;
};

const chessToGameData = (chess: ChessInstance): number[][][] => {
  const gameData: number[][][] = [];
  const ranks = chess.SQUARES;
  for (let rankIndex = 0; rankIndex < ranks.length; rankIndex += 8) {
    const row: number[][] = [];
    for (let fileIndex = 0; fileIndex < 8; fileIndex++) {
      const square = ranks[rankIndex + fileIndex];
      const piece = chess.get(square);
      const pieceIndex = pieceToIndex(piece);
      row.push([pieceIndex]);
    }
    gameData.push(row);
  }
  return gameData;
};

const pieceToIndex = (piece: string | null): number => {
  const pieceMap: { [key: string]: number } = {
    p: 1,
    n: 2,
    b: 3,
    r: 4,
    q: 5,
    k: 6,
    P: 7,
    N: 8,
    B: 9,
    R: 10,
    Q: 11,
    K: 12,
  };
  if (piece === null) {
    return 0;
  } else {
    return pieceMap[piece];
  }
};
