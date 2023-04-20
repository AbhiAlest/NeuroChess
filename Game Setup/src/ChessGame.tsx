import React, { useState } from "react";
import Chessboard from "chessboardjsx";
import Chess from "chess.js";
import { predictBestMove, train, loadModel } from "./DeepLearningBot";

const ChessGame = () => {
  const [chess] = useState(new Chess());
  const [board, setBoard] = useState(chess.board());
  const [bestMove, setBestMove] = useState("");
  const [botColor, setBotColor] = useState("black");

  const handleMove = ({ from, to }: any) => {
    const move = chess.move({ from, to });

    if (move !== null) {
      setBoard(chess.board());
      setBestMove("");

      if (chess.turn() === botColor) {
        setTimeout(() => {
          const botMove = predictBestMove(chess);
          const move = chess.move(botMove);
          if (move !== null) {
            setBoard(chess.board());
          }
        }, 500);
      }

      train(chess, 10);
    }
  };

  const handleBestMove = () => {
    const move = predictBestMove(chess);
    setBestMove(move);
  };

  return (
    <div>
      <Chessboard position={board} onDrop={handleMove} />
      <button onClick={handleBestMove}>Get Best Move</button>
      {bestMove && <div>The best move according to NeuroChess is: {bestMove}</div>}
    </div>
  );
};

loadModel("path/to/trained/model.json").then(() => {
  console.log("Model loaded");
});

export default ChessGame;
