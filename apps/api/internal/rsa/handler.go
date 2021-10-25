package rsa

import (
	"encoding/base64"
	"ezzy-web-crypto/api/apps/api/internal/apihelper"
	"ezzy-web-crypto/api/apps/api/internal/jsonutil"
	"ezzy-web-crypto/api/apps/api/internal/keystore"
	"fmt"
	"net/http"
)

func HandlePostNewKeyPair() http.HandlerFunc {
	return func(rw http.ResponseWriter, r *http.Request) {
		err := keystore.NewKeyPair()
		if err != nil {
			message := fmt.Sprintf("error generating keypair: %v", err)
			jsonutil.MarshalResponse(rw, http.StatusInternalServerError, &apihelper.ErrorResponse{
				ErrorMessage: message,
			})
			return
		}

		rw.WriteHeader(http.StatusCreated)
	}
}

type getPublicKeyResponse struct {
	PublicKey string `json:"public_key"`
}

func HandleGetPublicKey() http.HandlerFunc {
	return func(rw http.ResponseWriter, r *http.Request) {
		pub := keystore.ExportPublicKey()
		if pub == nil {
			message := "error no keypair available"
			jsonutil.MarshalResponse(rw, http.StatusNotFound, &apihelper.ErrorResponse{
				ErrorMessage: message,
			})
			return
		}

		pubBase64 := base64.StdEncoding.EncodeToString(pub)

		jsonutil.MarshalResponse(rw, http.StatusOK, &getPublicKeyResponse{
			PublicKey: pubBase64,
		})
	}
}

type rsaDecryptRequest struct {
	EncMessage string `json:"enc_message"`
}

type rsaDecryptResponse struct {
	Message string `json:"message"`
}

func HandleRsaDecryption() http.HandlerFunc {
	return func(rw http.ResponseWriter, r *http.Request) {
		var req rsaDecryptRequest

		code, err := jsonutil.Unmarshal(rw, r, &req)
		if err != nil {
			message := fmt.Sprintf("error unmarshaling API call, code: %v: %v", code, err)
			jsonutil.MarshalResponse(rw, code, &apihelper.ErrorResponse{
				ErrorMessage: message,
			})
			return
		}

		plaintext, err := decrypt(req.EncMessage)
		if err != nil {
			message := fmt.Sprintf("error encrypting message: %v", err)
			jsonutil.MarshalResponse(rw, http.StatusInternalServerError, &apihelper.ErrorResponse{
				ErrorMessage: message,
			})
			return
		}

		jsonutil.MarshalResponse(rw, http.StatusOK, &rsaDecryptResponse{Message: plaintext})
	}
}

type rsaEncryptionRequest struct {
	PublicKeyBase64 string `json:"public_key"`
	Message         string `json:"message"`
}

type rsaEncryptionResponse struct {
	EncMessage string `json:"enc_message"`
}

func HandleRsaEncryption() http.HandlerFunc {
	return func(rw http.ResponseWriter, r *http.Request) {
		var req rsaEncryptionRequest
		code, err := jsonutil.Unmarshal(rw, r, &req)
		if err != nil {
			message := fmt.Sprintf("error unmarshaling API call, code: %v: %v", code, err)
			jsonutil.MarshalResponse(rw, code, &apihelper.ErrorResponse{
				ErrorMessage: message,
			})
			return
		}

		ciphertext, err := encrypt(req.PublicKeyBase64, req.Message)
		if err != nil {
			message := err.Error()
			jsonutil.MarshalResponse(rw, http.StatusInternalServerError, &apihelper.ErrorResponse{
				ErrorMessage: message,
			})
			return
		}

		jsonutil.MarshalResponse(rw, http.StatusOK, &rsaEncryptionResponse{
			EncMessage: ciphertext,
		})
	}
}
