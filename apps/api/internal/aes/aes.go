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
	c, err := aes.NewCipher(aesKey)
	if err != nil {
		fmt.Println(err)
	}

	gcm, err := cipher.NewGCM(c)
	if err != nil {
		fmt.Println(err)
	}

	nonce, cipherdata := encData[:gcm.NonceSize()], encData[gcm.NonceSize():]

	data, err := gcm.Open(nil, nonce, cipherdata, nil)
	if err != nil {
		fmt.Println(err)
	}

	return data
}
