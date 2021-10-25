package main

import (
	"ezzy-web-crypto/api/apps/api/internal/aes"
	"ezzy-web-crypto/api/apps/api/internal/envelope"
	"ezzy-web-crypto/api/apps/api/internal/keystore"
	"ezzy-web-crypto/api/apps/api/internal/rsa"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func main() {
	err := keystore.NewKeyPair()
	if err != nil {
		log.Fatal(err)
	}

	r := chi.NewRouter()
	r.Use(middleware.Logger)

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:4200"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token", "Location"},
		ExposedHeaders:   []string{"Link", "Location"},
		AllowCredentials: true,
		MaxAge:           300, // Maximum value not ignored by any of major browsers
	}))

	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("welcome"))
	})

	r.Route("/aes", func(r chi.Router) {
		r.Post("/dec", aes.HandleAesDecryption())
	})

	r.Route("/rsa", func(r chi.Router) {
		r.Post("/", rsa.HandlePostNewKeyPair())
		r.Get("/pub", rsa.HandleGetPublicKey())
		r.Post("/dec", rsa.HandleRsaDecryption())
		r.Post("/enc", rsa.HandleRsaEncryption())
	})

	r.Route("/envelope", func(r chi.Router) {
		r.Post("/open", envelope.HandleEnvelopeOpen())
	})

	http.ListenAndServe(":3000", r)
}
