package aes

import (
	"ezzy-web-crypto/api/apps/api/internal/apihelper"
	"ezzy-web-crypto/api/apps/api/internal/jsonutil"
	"fmt"
	"net/http"
)

type aesDecryptionRequest struct {
	EncMessage   string `json:"enc_message"`
	AesKeyBase64 string `json:"aes"`
}

type aesDecryptionResponse struct {
	Message string `json:"message"`
}

func HandleAesDecryption() http.HandlerFunc {
	return func(rw http.ResponseWriter, r *http.Request) {
		var request aesDecryptionRequest

		code, err := jsonutil.Unmarshal(rw, r, &request)
		if err != nil {
			message := fmt.Sprintf("error unmarshaling API call, code: %v: %v", code, err)
			jsonutil.MarshalResponse(rw, http.StatusBadRequest, &apihelper.ErrorResponse{
				ErrorMessage: message,
			})
			return
		}

		plaintext := decrypt(request.AesKeyBase64, request.EncMessage)

		jsonutil.MarshalResponse(rw, http.StatusOK, &aesDecryptionResponse{
			Message: string(plaintext),
		})
	}
}
