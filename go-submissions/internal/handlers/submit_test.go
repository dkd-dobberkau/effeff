package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-chi/chi/v5"

	"github.com/dkd-dobberkau/effeff-go/internal/models"
)

// mockStore implements FormStore for testing
type mockStore struct {
	form    *models.Form
	formErr error
	subID   string
	subErr  error
	healthy error
}

func (m *mockStore) GetFormBySlug(slug string) (*models.Form, error) {
	return m.form, m.formErr
}

func (m *mockStore) CreateSubmission(sub *models.Submission) (string, error) {
	return m.subID, m.subErr
}

func (m *mockStore) IncrementFormStats(formID string, durationSec int) error {
	return nil
}

func (m *mockStore) Health() error {
	return m.healthy
}

func testForm() *models.Form {
	return &models.Form{
		ID:     "form:abc123",
		Title:  "Test Form",
		Slug:   "test-form",
		Status: "published",
		Questions: []models.Question{
			{
				ID:       "question:q1",
				FormID:   "form:abc123",
				Type:     "text",
				Title:    "Name",
				Required: true,
			},
			{
				ID:       "question:q2",
				FormID:   "form:abc123",
				Type:     "email",
				Title:    "Email",
				Required: false,
			},
		},
	}
}

func submitRequest(t *testing.T, handler http.Handler, slug string, body interface{}) *httptest.ResponseRecorder {
	t.Helper()

	var reqBody []byte
	if body != nil {
		var err error
		reqBody, err = json.Marshal(body)
		if err != nil {
			t.Fatalf("failed to marshal request body: %v", err)
		}
	}

	req := httptest.NewRequest("POST", "/submit/"+slug, bytes.NewReader(reqBody))
	req.Header.Set("Content-Type", "application/json")

	// Set up chi URL params
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("formSlug", slug)
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)
	return rec
}

func TestSubmitForm_FormNotFound(t *testing.T) {
	ms := &mockStore{
		formErr: fmt.Errorf("form not found"),
	}
	h := New(ms, nil)

	rec := submitRequest(t, http.HandlerFunc(h.SubmitForm), "nonexistent", map[string]interface{}{
		"answers": []interface{}{},
	})

	if rec.Code != http.StatusNotFound {
		t.Errorf("expected 404, got %d", rec.Code)
	}

	var resp models.ErrorResponse
	json.NewDecoder(rec.Body).Decode(&resp)
	if resp.Error != "Form not found or not published" {
		t.Errorf("unexpected error message: %s", resp.Error)
	}
}

func TestSubmitForm_StoreError(t *testing.T) {
	ms := &mockStore{
		formErr: fmt.Errorf("connection refused"),
	}
	h := New(ms, nil)

	rec := submitRequest(t, http.HandlerFunc(h.SubmitForm), "test-form", map[string]interface{}{
		"answers": []interface{}{},
	})

	if rec.Code != http.StatusInternalServerError {
		t.Errorf("expected 500, got %d", rec.Code)
	}
}

func TestSubmitForm_InvalidJSON(t *testing.T) {
	ms := &mockStore{form: testForm()}
	h := New(ms, nil)

	req := httptest.NewRequest("POST", "/submit/test-form", bytes.NewReader([]byte("{invalid")))
	req.Header.Set("Content-Type", "application/json")

	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("formSlug", "test-form")
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

	rec := httptest.NewRecorder()
	h.SubmitForm(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", rec.Code)
	}
}

func TestSubmitForm_ValidationFailure(t *testing.T) {
	ms := &mockStore{form: testForm()}
	h := New(ms, nil)

	// Missing required "Name" field
	rec := submitRequest(t, http.HandlerFunc(h.SubmitForm), "test-form", models.SubmissionRequest{
		Answers: []models.Answer{},
	})

	if rec.Code != http.StatusUnprocessableEntity {
		t.Errorf("expected 422, got %d", rec.Code)
	}

	var resp models.ErrorResponse
	json.NewDecoder(rec.Body).Decode(&resp)
	if resp.Error != "Validation failed" {
		t.Errorf("unexpected error: %s", resp.Error)
	}
	if resp.Details["question:q1"] == "" {
		t.Error("expected validation detail for question:q1")
	}
	// Verify German error message
	if resp.Details["question:q1"] != "'Name' ist ein Pflichtfeld" {
		t.Errorf("expected German error message, got %q", resp.Details["question:q1"])
	}
}

func TestSubmitForm_Success(t *testing.T) {
	ms := &mockStore{
		form:  testForm(),
		subID: "submission:xyz789",
	}
	h := New(ms, nil)

	rec := submitRequest(t, http.HandlerFunc(h.SubmitForm), "test-form", models.SubmissionRequest{
		Answers: []models.Answer{
			{QuestionID: "question:q1", Value: "John Doe"},
		},
	})

	if rec.Code != http.StatusCreated {
		t.Errorf("expected 201, got %d", rec.Code)
	}

	var resp models.SubmissionResponse
	json.NewDecoder(rec.Body).Decode(&resp)
	if !resp.Success {
		t.Error("expected success=true")
	}
	if resp.ID != "submission:xyz789" {
		t.Errorf("expected submission ID submission:xyz789, got %s", resp.ID)
	}
}

func TestSubmitForm_CreateError(t *testing.T) {
	ms := &mockStore{
		form:   testForm(),
		subErr: fmt.Errorf("disk full"),
	}
	h := New(ms, nil)

	rec := submitRequest(t, http.HandlerFunc(h.SubmitForm), "test-form", models.SubmissionRequest{
		Answers: []models.Answer{
			{QuestionID: "question:q1", Value: "John Doe"},
		},
	})

	if rec.Code != http.StatusInternalServerError {
		t.Errorf("expected 500, got %d", rec.Code)
	}
}

func TestHealth_Healthy(t *testing.T) {
	ms := &mockStore{healthy: nil}
	h := New(ms, nil)

	req := httptest.NewRequest("GET", "/health", nil)
	rec := httptest.NewRecorder()
	h.Health(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}

	var resp map[string]string
	json.NewDecoder(rec.Body).Decode(&resp)
	if resp["status"] != "healthy" {
		t.Errorf("expected healthy status, got %s", resp["status"])
	}
}

func TestHealth_Unhealthy(t *testing.T) {
	ms := &mockStore{healthy: fmt.Errorf("connection refused")}
	h := New(ms, nil)

	req := httptest.NewRequest("GET", "/health", nil)
	rec := httptest.NewRecorder()
	h.Health(rec, req)

	if rec.Code != http.StatusServiceUnavailable {
		t.Errorf("expected 503, got %d", rec.Code)
	}

	var resp map[string]string
	json.NewDecoder(rec.Body).Decode(&resp)
	if resp["status"] != "unhealthy" {
		t.Errorf("expected unhealthy status, got %s", resp["status"])
	}
}

func TestRealIP(t *testing.T) {
	tests := []struct {
		name     string
		headers  map[string]string
		remote   string
		expected string
	}{
		{
			name:     "X-Forwarded-For single",
			headers:  map[string]string{"X-Forwarded-For": "1.2.3.4"},
			remote:   "127.0.0.1:8080",
			expected: "1.2.3.4",
		},
		{
			name:     "X-Forwarded-For multiple takes first",
			headers:  map[string]string{"X-Forwarded-For": "1.2.3.4, 5.6.7.8, 9.10.11.12"},
			remote:   "127.0.0.1:8080",
			expected: "1.2.3.4",
		},
		{
			name:     "X-Real-IP",
			headers:  map[string]string{"X-Real-IP": "10.0.0.1"},
			remote:   "127.0.0.1:8080",
			expected: "10.0.0.1",
		},
		{
			name:     "X-Forwarded-For takes precedence over X-Real-IP",
			headers:  map[string]string{"X-Forwarded-For": "1.2.3.4", "X-Real-IP": "10.0.0.1"},
			remote:   "127.0.0.1:8080",
			expected: "1.2.3.4",
		},
		{
			name:     "fallback to RemoteAddr",
			headers:  map[string]string{},
			remote:   "192.168.1.1:12345",
			expected: "192.168.1.1:12345",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest("GET", "/", nil)
			req.RemoteAddr = tt.remote
			for k, v := range tt.headers {
				req.Header.Set(k, v)
			}
			got := realIP(req)
			if got != tt.expected {
				t.Errorf("realIP() = %q, want %q", got, tt.expected)
			}
		})
	}
}

func TestSubmitForm_EmptySlug(t *testing.T) {
	ms := &mockStore{}
	h := New(ms, nil)

	req := httptest.NewRequest("POST", "/submit/", bytes.NewReader([]byte("{}")))
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("formSlug", "")
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

	rec := httptest.NewRecorder()
	h.SubmitForm(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", rec.Code)
	}
}
