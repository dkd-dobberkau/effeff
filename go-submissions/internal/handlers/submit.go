package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/dkd-dobberkau/effeff-go/internal/models"
	"github.com/dkd-dobberkau/effeff-go/internal/validator"
)

var slugPattern = regexp.MustCompile(`^[a-z0-9][a-z0-9\-]*[a-z0-9]$`)

const maxUploadSize = 32 << 20 // 32 MB

type Handler struct {
	store   FormStore
	storage FileStorage
}

func New(s FormStore, fs FileStorage) *Handler {
	return &Handler{store: s, storage: fs}
}

// SubmitForm handles POST /submit/:form_slug
func (h *Handler) SubmitForm(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "formSlug")
	if slug == "" {
		writeError(w, http.StatusBadRequest, "Form slug is required", nil)
		return
	}
	if len(slug) < 2 || len(slug) > 100 || !slugPattern.MatchString(slug) {
		writeError(w, http.StatusBadRequest, "Invalid form slug format", nil)
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

	// Parse request — handle both JSON and multipart
	var req models.SubmissionRequest
	contentType := r.Header.Get("Content-Type")

	if strings.HasPrefix(contentType, "multipart/form-data") {
		if err := r.ParseMultipartForm(maxUploadSize); err != nil {
			writeError(w, http.StatusBadRequest, "Failed to parse multipart form", nil)
			return
		}

		// Extract answers JSON from form field
		answersJSON := r.FormValue("answers")
		if answersJSON == "" {
			writeError(w, http.StatusBadRequest, "Missing answers field", nil)
			return
		}
		if err := json.Unmarshal([]byte(answersJSON), &req.Answers); err != nil {
			writeError(w, http.StatusBadRequest, "Invalid answers JSON", nil)
			return
		}

		// Parse metadata
		metaJSON := r.FormValue("metadata")
		if metaJSON != "" {
			json.Unmarshal([]byte(metaJSON), &req.Metadata)
		}

		// Parse started_at
		if startedStr := r.FormValue("started_at"); startedStr != "" {
			if t, err := time.Parse(time.RFC3339, startedStr); err == nil {
				req.StartedAt = &t
			}
		}

		// Handle file uploads — match file fields to file_upload questions
		if h.storage != nil {
			questionMap := make(map[string]models.Question)
			for _, q := range form.Questions {
				questionMap[q.ID] = q
			}

			for i, answer := range req.Answers {
				q, exists := questionMap[answer.QuestionID]
				if !exists || q.Type != "file_upload" {
					continue
				}

				// Check if a file was uploaded for this question
				file, header, err := r.FormFile(answer.QuestionID)
				if err != nil {
					continue // No file for this question
				}
				defer file.Close()

				// Generate unique path
				ext := filepath.Ext(header.Filename)
				objectKey := fmt.Sprintf("forms/%s/%s/%s%s",
					form.ID, q.ID, uuid.New().String(), ext)

				url, err := h.storage.Upload(
					context.Background(),
					objectKey,
					file,
					header.Size,
					header.Header.Get("Content-Type"),
				)
				if err != nil {
					log.Printf("ERROR uploading file for question %s: %v", q.ID, err)
					writeError(w, http.StatusInternalServerError, "File upload failed", nil)
					return
				}

				// Replace answer value with the S3 URL
				req.Answers[i].Value = url
			}
		}
	} else {
		// Standard JSON body
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, "Invalid request body", nil)
			return
		}
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
		"service": "effeff-submissions",
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
