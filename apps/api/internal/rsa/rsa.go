package rsa

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"ezzy-web-crypto/api/apps/api/internal/keystore"
	"fmt"
)

func decrypt(encMsgBase64 string) (string, error) {
	priv := keystore.PrivateKey()
	if priv == nil {
		return "", errors.New("no private key available")
	}

	encMessage, err := base64.StdEncoding.DecodeString(encMsgBase64)
	if err != nil {
		return "", err
	}

	hash := sha256.New()
	plaintext, err := rsa.DecryptOAEP(hash, rand.Reader, priv, encMessage, nil)
	if err != nil {
		return "", nil
	}

	return string(plaintext), nil
}

func encrypt(pubBase64, msg string) (string, error) {
	pub, err := keystore.ImportPublicKey(pubBase64)
	if err != nil {
		return "", fmt.Errorf("error importing public key: %v", err)
	}

	hash := sha256.New()
	cipherbytes, err := rsa.EncryptOAEP(hash, rand.Reader, pub, []byte(msg), nil)
	if err != nil {
		return "", fmt.Errorf("error encrypting message: %v", err)
	}

	return base64.StdEncoding.EncodeToString(cipherbytes), nil
}
