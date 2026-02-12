package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/go-chi/httprate"

	"github.com/formflow/go-submissions/internal/handlers"
	"github.com/formflow/go-submissions/internal/store"
)

func main() {
	log.SetFlags(log.LstdFlags | log.Lshortfile)

	// Init store
	db := store.New()

	// Wait for SurrealDB
	log.Println("⏳ Waiting for SurrealDB...")
	for i := 0; i < 30; i++ {
		if err := db.Health(); err == nil {
			log.Println("✅ SurrealDB connected")
			break
		}
		time.Sleep(time.Second)
	}

	// Init handlers
	h := handlers.New(db)

	// Router
	r := chi.NewRouter()

	// Middleware
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Compress(5))
	r.Use(middleware.Timeout(30 * time.Second))

	// CORS
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173", "http://localhost:3000"},
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		ExposedHeaders:   []string{"X-Request-ID"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Rate limiting: 60 submissions per minute per IP
	r.Use(httprate.LimitByIP(60, time.Minute))

	// Routes
	r.Get("/health", h.Health)
	r.Post("/submit/{formSlug}", h.SubmitForm)

	// Start server
	port := getEnv("PORT", "8080")
	addr := fmt.Sprintf(":%s", port)

	log.Printf("🚀 FormFlow Submissions Service starting on %s", addr)
	if err := http.ListenAndServe(addr, r); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
