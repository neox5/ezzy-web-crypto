package aes

import (
	"crypto/aes"
	"crypto/cipher"
	"encoding/base64"
	"fmt"
)

func decrypt(aesBase64 string, encMsgBase64 string) []byte {
	key, _ := base64.StdEncoding.DecodeString(aesBase64)
	encMsg, _ := base64.StdEncoding.DecodeString(encMsgBase64)

	return Decrypt(key, encMsg)
}

func Decrypt(aesKey, encData []byte) []byte {
	nonce, cipherdata := encData[:16], encData[16:]

	c, err := aes.NewCipher(aesKey)
	if err != nil {
		fmt.Println(err)
	}

	gcm, err := cipher.NewGCMWithNonceSize(c, 16)
	if err != nil {
		fmt.Println(err)
	}

	data, err := gcm.Open(nil, nonce, cipherdata, nil)
	if err != nil {
		fmt.Println(err)
	}

	return data
}
