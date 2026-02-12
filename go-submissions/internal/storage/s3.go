package storage

import (
	"context"
	"fmt"
	"io"
	"log"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

// S3Storage implements Storage using an S3-compatible backend (Garage, MinIO, AWS).
type S3Storage struct {
	client   *minio.Client
	bucket   string
	endpoint string
	useSSL   bool
}

// NewS3Storage creates a new S3 storage client.
func NewS3Storage(endpoint, accessKey, secretKey, bucket string, useSSL bool) (*S3Storage, error) {
	client, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKey, secretKey, ""),
		Secure: useSSL,
	})
	if err != nil {
		return nil, fmt.Errorf("init S3 client: %w", err)
	}

	s := &S3Storage{
		client:   client,
		bucket:   bucket,
		endpoint: endpoint,
		useSSL:   useSSL,
	}

	// Check if bucket exists
	ctx := context.Background()
	exists, err := client.BucketExists(ctx, bucket)
	if err != nil {
		log.Printf("WARN: could not check S3 bucket: %v", err)
	} else if !exists {
		log.Printf("WARN: S3 bucket '%s' does not exist yet", bucket)
	}

	return s, nil
}

// Upload stores a file in S3 and returns the object path.
func (s *S3Storage) Upload(ctx context.Context, filename string, reader io.Reader, size int64, contentType string) (string, error) {
	opts := minio.PutObjectOptions{
		ContentType: contentType,
	}

	_, err := s.client.PutObject(ctx, s.bucket, filename, reader, size, opts)
	if err != nil {
		return "", fmt.Errorf("upload to S3: %w", err)
	}

	return s.GetURL(filename), nil
}

// GetURL constructs a URL for the given filename.
func (s *S3Storage) GetURL(filename string) string {
	scheme := "http"
	if s.useSSL {
		scheme = "https"
	}
	return fmt.Sprintf("%s://%s/%s/%s", scheme, s.endpoint, s.bucket, filename)
}
