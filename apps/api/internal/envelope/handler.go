package envelope

import (
	"encoding/base64"
	"ezzy-web-crypto/api/apps/api/internal/aes"
	"ezzy-web-crypto/api/apps/api/internal/apihelper"
	"ezzy-web-crypto/api/apps/api/internal/jsonutil"
	"fmt"
	"net/http"
)

type envelopeOpenRequest struct {
	Envelope   string `json:"envelope"`
	EncMessage string `json:"enc_message"`
}

type envelopeOpenResponse struct {
	Message string `json:"message"`
}

func HandleEnvelopeOpen() http.HandlerFunc {
	return func(rw http.ResponseWriter, r *http.Request) {
		var req envelopeOpenRequest

		code, err := jsonutil.Unmarshal(rw, r, &req)
		if err != nil {
			message := fmt.Sprintf("error unmarshaling API call, code: %v: %v", code, err)
			jsonutil.MarshalResponse(rw, http.StatusBadRequest, &apihelper.ErrorResponse{
				ErrorMessage: message,
			})
			return
		}

		env, err := envelopeFromString(req.Envelope)
		if err != nil {
			message := fmt.Sprintf("error unwraping envelope: %v", err)
			jsonutil.MarshalResponse(rw, http.StatusBadRequest, &apihelper.ErrorResponse{
				ErrorMessage: message,
			})
			return
		}

		key, err := env.Open()
		if err != nil {
			message := fmt.Sprintf("error opening envelope: %v", err)
			jsonutil.MarshalResponse(rw, http.StatusBadRequest, &apihelper.ErrorResponse{
				ErrorMessage: message,
			})
			return
		}

		encData, err := base64.StdEncoding.DecodeString(req.EncMessage)
		if err != nil {
			message := fmt.Sprintf("error base64-decoding EncMessage: %v", err)
			jsonutil.MarshalResponse(rw, http.StatusBadRequest, &apihelper.ErrorResponse{
				ErrorMessage: message,
			})
			return
		}

		message := aes.Decrypt(key, encData)

		jsonutil.MarshalResponse(rw, http.StatusOK, &envelopeOpenResponse{
			Message: string(message),
		})
	}
}
