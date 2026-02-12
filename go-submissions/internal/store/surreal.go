package store

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"github.com/formflow/go-submissions/internal/models"
)

// Store handles SurrealDB interactions via HTTP API
type Store struct {
	baseURL    string
	user       string
	pass       string
	namespace  string
	database   string
	httpClient *http.Client
}

// New creates a new SurrealDB store
func New() *Store {
	return &Store{
		baseURL:   getEnv("SURREAL_URL", "http://localhost:8000"),
		user:      getEnv("SURREAL_USER", "root"),
		pass:      getEnv("SURREAL_PASS", "formflow_secret"),
		namespace: getEnv("SURREAL_NS", "formflow"),
		database:  getEnv("SURREAL_DB", "main"),
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// surrealQuery executes a SurrealQL query via HTTP
func (s *Store) surrealQuery(query string, vars map[string]interface{}) ([]json.RawMessage, error) {
	req, err := http.NewRequest("POST", s.baseURL+"/sql", bytes.NewReader([]byte(query)))
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}

	req.Header.Set("Accept", "application/json")
	req.Header.Set("surreal-ns", s.namespace)
	req.Header.Set("surreal-db", s.database)
	req.SetBasicAuth(s.user, s.pass)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("execute query: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("surreal error (status %d): %s", resp.StatusCode, string(respBody))
	}

	var results []struct {
		Result json.RawMessage `json:"result"`
		Status string          `json:"status"`
	}

	if err := json.Unmarshal(respBody, &results); err != nil {
		return nil, fmt.Errorf("unmarshal response: %w", err)
	}

	var rawResults []json.RawMessage
	for _, r := range results {
		rawResults = append(rawResults, r.Result)
	}

	return rawResults, nil
}

// GetFormBySlug fetches a published form with its questions
func (s *Store) GetFormBySlug(slug string) (*models.Form, error) {
	if err := validateSlug(slug); err != nil {
		return nil, fmt.Errorf("invalid slug: %w", err)
	}

	escaped := escapeString(slug)
	query := fmt.Sprintf(`
		SELECT * FROM form WHERE slug = '%s' AND status = 'published' LIMIT 1;
	`, escaped)

	results, err := s.surrealQuery(query, nil)
	if err != nil {
		return nil, fmt.Errorf("query form: %w", err)
	}

	if len(results) == 0 {
		return nil, fmt.Errorf("form not found")
	}

	var forms []models.Form
	if err := json.Unmarshal(results[0], &forms); err != nil {
		return nil, fmt.Errorf("unmarshal form: %w", err)
	}

	if len(forms) == 0 {
		return nil, fmt.Errorf("form not found: %s", slug)
	}

	form := &forms[0]

	// Validate the form ID before using it in the next query
	if err := validateRecordID(form.ID); err != nil {
		return nil, fmt.Errorf("invalid form ID from DB: %w", err)
	}

	// Fetch questions
	qQuery := fmt.Sprintf(`
		SELECT * FROM question WHERE form_id = %s ORDER BY position ASC;
	`, form.ID)

	qResults, err := s.surrealQuery(qQuery, nil)
	if err != nil {
		return nil, fmt.Errorf("query questions: %w", err)
	}

	if len(qResults) > 0 {
		if err := json.Unmarshal(qResults[0], &form.Questions); err != nil {
			return nil, fmt.Errorf("unmarshal questions: %w", err)
		}
	}

	return form, nil
}

// CreateSubmission stores a new submission
func (s *Store) CreateSubmission(sub *models.Submission) (string, error) {
	if err := validateRecordID(sub.FormID); err != nil {
		return "", fmt.Errorf("invalid form ID: %w", err)
	}

	// Transform answers: rename "value" to "answer_value" for SurrealDB
	// ("value" is a reserved keyword in SurrealDB and gets silently dropped)
	type dbAnswer struct {
		QuestionID  string      `json:"question_id"`
		AnswerValue interface{} `json:"answer_value"`
	}
	dbAnswers := make([]dbAnswer, len(sub.Answers))
	for i, a := range sub.Answers {
		dbAnswers[i] = dbAnswer{QuestionID: a.QuestionID, AnswerValue: a.Value}
	}
	answersJSON, _ := json.Marshal(dbAnswers)
	metaJSON, _ := json.Marshal(sub.Metadata)

	query := fmt.Sprintf(`
		CREATE submission SET
			form_id = %s,
			answers = %s,
			metadata = %s,
			started_at = d'%s',
			completed_at = time::now();
	`, sub.FormID, string(answersJSON), string(metaJSON),
		safeTime(sub.StartedAt))

	results, err := s.surrealQuery(query, nil)
	if err != nil {
		return "", fmt.Errorf("create submission: %w", err)
	}

	if len(results) == 0 {
		return "", fmt.Errorf("no result from create")
	}

	var created []struct {
		ID string `json:"id"`
	}
	if err := json.Unmarshal(results[0], &created); err != nil {
		return "", fmt.Errorf("unmarshal created: %w", err)
	}

	if len(created) == 0 {
		return "", fmt.Errorf("submission not created")
	}

	return created[0].ID, nil
}

// IncrementFormStats updates the precomputed analytics
func (s *Store) IncrementFormStats(formID string, durationSec int) error {
	if err := validateRecordID(formID); err != nil {
		return fmt.Errorf("invalid form ID: %w", err)
	}

	query := fmt.Sprintf(`
		UPSERT form_stats SET
			form_id = %s,
			total_submissions += 1,
			avg_duration = (avg_duration * (total_submissions - 1) + %d) / total_submissions,
			updated_at = time::now()
		WHERE form_id = %s;
	`, formID, durationSec, formID)

	_, err := s.surrealQuery(query, nil)
	return err
}

// Health checks if SurrealDB is reachable
func (s *Store) Health() error {
	resp, err := s.httpClient.Get(s.baseURL + "/health")
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("surreal unhealthy: %d", resp.StatusCode)
	}
	return nil
}

func safeTime(t *time.Time) string {
	if t == nil {
		return time.Now().UTC().Format(time.RFC3339)
	}
	return t.UTC().Format(time.RFC3339)
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
