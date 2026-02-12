package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"

	"github.com/formflow/go-submissions/internal/models"
	"github.com/formflow/go-submissions/internal/store"
	"github.com/formflow/go-submissions/internal/validator"
)

type Handler struct {
	store *store.Store
}

func New(s *store.Store) *Handler {
	return &Handler{store: s}
}

// SubmitForm handles POST /submit/:form_slug
func (h *Handler) SubmitForm(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "formSlug")
	if slug == "" {
		writeError(w, http.StatusBadRequest, "Form slug is required", nil)
		return
	}

	// Fetch form definition
	form, err := h.store.GetFormBySlug(slug)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			writeError(w, http.StatusNotFound, "Form not found or not published", nil)
		} else {
			log.Printf("ERROR fetching form %s: %v", slug, err)
			writeError(w, http.StatusInternalServerError, "Failed to load form", nil)
		}
		return
	}

	// Parse request body
	var req models.SubmissionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body", nil)
		return
	}

	// Validate
	if validationErrors := validator.ValidateSubmission(form, &req); len(validationErrors) > 0 {
		writeError(w, http.StatusUnprocessableEntity, "Validation failed", validationErrors)
		return
	}

	// Enrich metadata
	req.Metadata.IP = realIP(r)
	req.Metadata.UserAgent = r.UserAgent()
	req.Metadata.Referrer = r.Referer()

	// Build submission
	submission := &models.Submission{
		FormID:      form.ID,
		Answers:     req.Answers,
		Metadata:    req.Metadata,
		StartedAt:   req.StartedAt,
		CompletedAt: time.Now().UTC(),
	}

	// Store submission
	subID, err := h.store.CreateSubmission(submission)
	if err != nil {
		log.Printf("ERROR creating submission for form %s: %v", slug, err)
		writeError(w, http.StatusInternalServerError, "Failed to save submission", nil)
		return
	}

	// Update stats asynchronously
	go func() {
		if err := h.store.IncrementFormStats(form.ID, req.Metadata.Duration); err != nil {
			log.Printf("WARN failed to update stats for form %s: %v", form.ID, err)
		}
	}()

	// Respond
	resp := models.SubmissionResponse{
		Success:     true,
		ID:          subID,
		RedirectURL: form.Settings.RedirectURL,
		Message:     "Submission saved successfully",
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(resp)
}

// Health handles GET /health
func (h *Handler) Health(w http.ResponseWriter, r *http.Request) {
	if err := h.store.Health(); err != nil {
		w.WriteHeader(http.StatusServiceUnavailable)
		json.NewEncoder(w).Encode(map[string]string{
			"status": "unhealthy",
			"error":  err.Error(),
		})
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "healthy",
		"service": "formflow-submissions",
	})
}

func writeError(w http.ResponseWriter, status int, msg string, details map[string]string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(models.ErrorResponse{
		Error:   msg,
		Details: details,
	})
}

func realIP(r *http.Request) string {
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		parts := strings.Split(xff, ",")
		return strings.TrimSpace(parts[0])
	}
	if xri := r.Header.Get("X-Real-IP"); xri != "" {
		return xri
	}
	return r.RemoteAddr
}
