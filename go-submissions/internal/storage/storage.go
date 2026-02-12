package storage

import (
	"context"
	"io"
)

// Storage defines the interface for file storage backends.
type Storage interface {
	Upload(ctx context.Context, filename string, reader io.Reader, size int64, contentType string) (url string, err error)
	GetURL(filename string) string
}
