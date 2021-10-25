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

	nonce, ciphertext := encMsg[:16], encMsg[16:]

	c, err := aes.NewCipher(key)
	if err != nil {
		fmt.Println(err)
	}

	gcm, err := cipher.NewGCMWithNonceSize(c, 16)
	if err != nil {
		fmt.Println(err)
	}

	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		fmt.Println(err)
	}

	return plaintext
}
