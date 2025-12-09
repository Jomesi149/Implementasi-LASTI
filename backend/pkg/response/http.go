package response

import (
	"encoding/json"
	"net/http"
)

// JSON writes the payload with JSON content type.
func JSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

// Error serializes an error envelope expected by the frontend.
func Error(w http.ResponseWriter, status int, message string) {
	JSON(w, status, map[string]any{
		"error":   true,
		"message": message,
	})
}
