package envelope

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"ezzy-web-crypto/api/apps/api/internal/keystore"
)

type Envelope []byte

func envelopeFromString(envelopeBase64 string) (*Envelope, error) {
	var envelope Envelope

	envelope, err := base64.StdEncoding.DecodeString(envelopeBase64)
	if err != nil {
		return nil, err
	}

	return &envelope, nil
}

func (e *Envelope) Open() ([]byte, error) {
	priv := keystore.PrivateKey()
	if priv == nil {
		return nil, errors.New("no private key available")
	}

	hash := sha256.New()
	aesKey, err := rsa.DecryptOAEP(hash, rand.Reader, priv, *e, nil)
	if err != nil {
		return nil, err
	}

	return aesKey, nil
}
