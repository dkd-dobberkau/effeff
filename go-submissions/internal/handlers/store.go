package handlers

import (
	"github.com/dkd-dobberkau/effeff-go/internal/models"
	"github.com/dkd-dobberkau/effeff-go/internal/storage"
)

// FormStore defines the store operations needed by handlers.
// *store.Store satisfies this interface.
type FormStore interface {
	GetFormBySlug(slug string) (*models.Form, error)
	CreateSubmission(sub *models.Submission) (string, error)
	IncrementFormStats(formID string, durationSec int) error
	Health() error
}

// FileStorage defines file storage operations. May be nil if not configured.
type FileStorage = storage.Storage
