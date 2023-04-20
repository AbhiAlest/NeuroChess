package main

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/mux"
	"github.com/notnil/chess"
	tf "github.com/tensorflow/tensorflow/tensorflow/go"
)

type RequestBody struct {
	Fen string `json:"fen"`
}

type ResponseBody struct {
	BestMove string `json:"bestMove"`
}

func main() {
	r := mux.NewRouter()

	// Move endpoint
	r.HandleFunc("/move", handleMove).Methods("POST")

	// Healthcheck endpoint
	r.HandleFunc("/health", handleHealth).Methods("GET")

	srv := &http.Server{
		Handler:      r,
		Addr:         ":8080",
		WriteTimeout: 15 * time.Second,
		ReadTimeout:  15 * time.Second,
	}

	log.Println("Server running on port 8080")
	log.Fatal(srv.ListenAndServe())
}

func handleMove(w http.ResponseWriter, r *http.Request) {
	var reqBody RequestBody

	// Validate request 
	err := json.NewDecoder(r.Body).Decode(&reqBody)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate FEN
	if !isValidFEN(reqBody.Fen) {
		http.Error(w, "Invalid FEN", http.StatusBadRequest)
		return
	}

	// Predict move
	chessBoard := chess.NewBoardFromFen(reqBody.Fen)
	bestMove := predictBestMove(chessBoard)

	resBody := ResponseBody{
		BestMove: bestMove,
	}

	// Encode response 
	w.Header().Set("Content-Type", "application/json")
	err = json.NewEncoder(w).Encode(resBody)
	if err != nil {
		http.Error(w, "Failed to encode response body", http.StatusInternalServerError)
	}
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
}

func isValidFEN(fen string) bool {
	_, err := chess.NewBoardFromFen(fen)
	return err == nil
}


func predictBestMove(board *chess.Board) string {
	// Convert board to tensor
	tensor, err := boardToTensor(board)
	if err != nil {
		log.Fatal(err)
	}

	// Load saved model
	model, err := tf.LoadSavedModel("model", []string{"predict"}, nil)
	if err != nil {
		log.Fatal(err)
	}

	// Make the prediction via deep learning algorithm
	output, err := model.Session.Run(
		map[tf.Output]*tf.Tensor{
			model.Graph.Operation("serving_default_input_1").Output(0): tensor,
		},
		[]tf.Output{
			model.Graph.Operation("StatefulPartitionedCall").Output(0),
		},
		nil,
	)
	if err != nil {
		log.Fatal(err)
	}

	// Extract predicted move
	predictedMove := output[0].Value().([][]float32)[0]

	// Convert predicted move to a string
	move := chess.MoveOf(int(predictedMove[0]), int(predictedMove[1]))

	return move.String()
}

func boardToTensor(board *chess.Board) (*tf.Tensor, error) {
	// Convert board to a flattened tensor
	var tensorData [64]int32
	for i := 0; i < 64; i++ {
		piece := board.Piece(chess.Square(i))
		if piece == chess.NoPiece {
			tensorData[i] = 0
		} else {
			tensorData[i] = pieceToIndex(piece)
		}
	}
	tensor, err := tf.NewTensor(tensorData)
	if err != nil {
	log.Fatalf("Failed to create tensor: %v", err)
}
// Run inference
output, err := model.Session.Run(
	map[tf.Output]*tf.Tensor{
		model.Graph.Operation("serving_default_input_1").Output(0): tensor,
	},
	[]tf.Output{
		model.Graph.Operation("StatefulPartitionedCall").Output(0),
	},
	nil,
)
if err != nil {
	log.Fatalf("Failed to run inference: %v", err)
}
// Decode output tensor 
outputTensor := output[0]
outputData := outputTensor.Value().([][]float32)
bestMoveIndex := int(outputData[0][0])
move := moves[bestMoveIndex].String()
return move
