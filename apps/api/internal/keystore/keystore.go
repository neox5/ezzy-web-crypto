package keystore

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/base64"
)

var rsaKey *rsa.PrivateKey

func NewKeyPair() error {
	reader := rand.Reader
	bitSize := 4096

	key, err := rsa.GenerateKey(reader, bitSize)
	if err != nil {
		return err
	}

	rsaKey = key

	return nil
}

func ExportPrivateKey() []byte {
	if rsaKey != nil {
		return x509.MarshalPKCS1PrivateKey(rsaKey)
	}
	return nil
}

func ExportPublicKey() []byte {
	if rsaKey != nil {
		pub, _ := x509.MarshalPKIXPublicKey(&rsaKey.PublicKey)
		return pub
	}
	return nil
}

func ImportPublicKey(pubBase64 string) (*rsa.PublicKey, error) {
	bytes, err := base64.StdEncoding.DecodeString(pubBase64)
	if err != nil {
		return nil, err
	}

	pub, err := x509.ParsePKIXPublicKey(bytes)
	if err != nil {
		return nil, err
	}

	return pub.(*rsa.PublicKey), nil
}

func PrivateKey() *rsa.PrivateKey {
	return rsaKey
}

func PublicKey() *rsa.PublicKey {
	return &rsaKey.PublicKey
}
