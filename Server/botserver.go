package main

import (
	"encoding/json"
	"log"
	"net/http"
)

type RequestBody struct {
	Fen string `json:"fen"`
}

type ResponseBody struct {
	BestMove string `json:"bestMove"`
}

func main() {
	http.HandleFunc("/move", handler)
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func handler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var reqBody RequestBody
	err := json.NewDecoder(r.Body).Decode(&reqBody)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	chess := chess.New(reqBody.Fen)
	bestMove := predictBestMove(chess)

	resBody := ResponseBody{
		BestMove: bestMove,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resBody)
}
