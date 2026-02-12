package models

import "time"

// Form represents a form fetched from SurrealDB for validation
type Form struct {
	ID          string     `json:"id"`
	Title       string     `json:"title"`
	Slug        string     `json:"slug"`
	Status      string     `json:"status"`
	Settings    FormSettings `json:"settings"`
	Questions   []Question `json:"questions,omitempty"`
}

type FormSettings struct {
	RedirectURL   *string `json:"redirect_url,omitempty"`
	NotifyEmail   *string `json:"notify_email,omitempty"`
	ShowProgress  bool    `json:"show_progress"`
	AllowMultiple bool    `json:"allow_multiple"`
	CloseDate     *string `json:"close_date,omitempty"`
}

// Question defines a single form question
type Question struct {
	ID          string                 `json:"id"`
	FormID      string                 `json:"form_id"`
	Type        string                 `json:"type"`
	Title       string                 `json:"title"`
	Position    int                    `json:"position"`
	Required    bool                   `json:"required"`
	Options     []ChoiceOption         `json:"options,omitempty"`
	Settings    map[string]interface{} `json:"settings,omitempty"`
	Validations map[string]interface{} `json:"validations,omitempty"`
}

type ChoiceOption struct {
	Key   string `json:"key"`
	Label string `json:"label"`
}

// SubmissionRequest is the incoming payload from the frontend
type SubmissionRequest struct {
	Answers   []Answer          `json:"answers" validate:"required"`
	Metadata  SubmissionMeta    `json:"metadata,omitempty"`
	StartedAt *time.Time        `json:"started_at,omitempty"`
}

type Answer struct {
	QuestionID string      `json:"question_id" validate:"required"`
	Value      interface{} `json:"value"`
}

type SubmissionMeta struct {
	IP        string `json:"ip,omitempty"`
	UserAgent string `json:"user_agent,omitempty"`
	Referrer  string `json:"referrer,omitempty"`
	Duration  int    `json:"duration_seconds,omitempty"`
}

// Submission is the record stored in SurrealDB
type Submission struct {
	ID          string         `json:"id,omitempty"`
	FormID      string         `json:"form_id"`
	Answers     []Answer       `json:"answers"`
	Metadata    SubmissionMeta `json:"metadata"`
	StartedAt   *time.Time     `json:"started_at,omitempty"`
	CompletedAt time.Time      `json:"completed_at"`
}

// SubmissionResponse is returned to the client
type SubmissionResponse struct {
	Success     bool    `json:"success"`
	ID          string  `json:"id,omitempty"`
	RedirectURL *string `json:"redirect_url,omitempty"`
	Message     string  `json:"message"`
}

// ErrorResponse for API errors
type ErrorResponse struct {
	Error   string            `json:"error"`
	Details map[string]string `json:"details,omitempty"`
}
