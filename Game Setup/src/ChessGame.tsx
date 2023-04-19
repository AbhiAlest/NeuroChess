import React, { useState } from "react";
import Chessboard from "chessboardjsx";
import Chess from "chess.js";
import { DeepLearningBot } from "./DeepLearningBot";

const ChessGame = () => {
  const [chess] = useState(new Chess());
  const [fen, setFen] = useState(chess.fen());
  const [side, setSide] = useState("white");

  const handleMove = (from: string, to: string) => {
    const move = chess.move({ from, to });

    // illegal move
    if (move === null) return;

    // Update board
    setFen(chess.fen());

    // Switch sides between turns
    setSide(side === "white" ? "black" : "white");

    // move and stuff
    setTimeout(() => {
      const botMove = DeepLearningBot.predictBestMove(chess);
      chess.move(botMove);
      setFen(chess.fen());
      setSide("white");
    }, 500);
  };

  return (
    <div>
      <Chessboard
        position={fen}
        onDrop={({ sourceSquare, targetSquare }) =>
          handleMove(sourceSquare, targetSquare)
        }
        orientation={side}
      />
    </div>
  );
};

export default ChessGame;
