package validator

import (
	"testing"

	"github.com/formflow/go-submissions/internal/models"
)

func makeForm(questions []models.Question) *models.Form {
	return &models.Form{
		ID:        "form:test1",
		Title:     "Test Form",
		Slug:      "test-form",
		Status:    "published",
		Questions: questions,
	}
}

func makeQuestion(id, qtype, title string, required bool) models.Question {
	return models.Question{
		ID:       id,
		FormID:   "form:test1",
		Type:     qtype,
		Title:    title,
		Required: required,
	}
}

func TestIsEmpty(t *testing.T) {
	tests := []struct {
		name string
		val  interface{}
		want bool
	}{
		{"nil", nil, true},
		{"empty string", "", true},
		{"whitespace only", "   ", true},
		{"tab and newline", "\t\n", true},
		{"empty slice", []interface{}{}, true},
		{"non-empty string", "hello", false},
		{"non-empty slice", []interface{}{"a"}, false},
		{"number zero", float64(0), false},
		{"boolean false", false, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := isEmpty(tt.val)
			if got != tt.want {
				t.Errorf("isEmpty(%v) = %v, want %v", tt.val, got, tt.want)
			}
		})
	}
}

func TestValidateSubmission_SkipTypes(t *testing.T) {
	skipTypes := []string{"welcome", "thank_you", "statement"}

	for _, st := range skipTypes {
		t.Run(st, func(t *testing.T) {
			form := makeForm([]models.Question{
				{ID: "q:1", Type: st, Title: "Skip me", Required: true},
			})
			req := &models.SubmissionRequest{Answers: []models.Answer{}}
			errs := ValidateSubmission(form, req)
			if len(errs) != 0 {
				t.Errorf("expected no errors for skip type %s, got %v", st, errs)
			}
		})
	}
}

func TestValidateSubmission_RequiredField(t *testing.T) {
	tests := []struct {
		name    string
		answers []models.Answer
		wantErr bool
	}{
		{
			name:    "missing answer",
			answers: []models.Answer{},
			wantErr: true,
		},
		{
			name:    "empty string answer",
			answers: []models.Answer{{QuestionID: "q:1", Value: ""}},
			wantErr: true,
		},
		{
			name:    "whitespace answer",
			answers: []models.Answer{{QuestionID: "q:1", Value: "   "}},
			wantErr: true,
		},
		{
			name:    "nil value answer",
			answers: []models.Answer{{QuestionID: "q:1", Value: nil}},
			wantErr: true,
		},
		{
			name:    "valid answer",
			answers: []models.Answer{{QuestionID: "q:1", Value: "John"}},
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			form := makeForm([]models.Question{
				makeQuestion("q:1", "text", "Name", true),
			})
			req := &models.SubmissionRequest{Answers: tt.answers}
			errs := ValidateSubmission(form, req)
			if tt.wantErr && len(errs) == 0 {
				t.Error("expected validation error, got none")
			}
			if !tt.wantErr && len(errs) > 0 {
				t.Errorf("expected no errors, got %v", errs)
			}
		})
	}
}

func TestValidateSubmission_OptionalField(t *testing.T) {
	form := makeForm([]models.Question{
		makeQuestion("q:1", "text", "Nickname", false),
	})

	// Missing answer for optional field should be fine
	req := &models.SubmissionRequest{Answers: []models.Answer{}}
	errs := ValidateSubmission(form, req)
	if len(errs) != 0 {
		t.Errorf("expected no errors for optional missing field, got %v", errs)
	}

	// Empty answer for optional field should also be fine
	req = &models.SubmissionRequest{Answers: []models.Answer{{QuestionID: "q:1", Value: ""}}}
	errs = ValidateSubmission(form, req)
	if len(errs) != 0 {
		t.Errorf("expected no errors for optional empty field, got %v", errs)
	}
}

func TestValidateSubmission_Email(t *testing.T) {
	tests := []struct {
		name    string
		value   string
		wantErr bool
	}{
		{"valid email", "user@example.com", false},
		{"valid with subdomain", "user@mail.example.com", false},
		{"valid with plus", "user+tag@example.com", false},
		{"missing @", "userexample.com", true},
		{"missing domain", "user@", true},
		{"missing tld", "user@example", true},
		{"spaces", "user @example.com", true},
		{"double @", "user@@example.com", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			form := makeForm([]models.Question{
				makeQuestion("q:1", "email", "Email", false),
			})
			req := &models.SubmissionRequest{
				Answers: []models.Answer{{QuestionID: "q:1", Value: tt.value}},
			}
			errs := ValidateSubmission(form, req)
			if tt.wantErr && len(errs) == 0 {
				t.Errorf("expected error for email %q, got none", tt.value)
			}
			if !tt.wantErr && len(errs) > 0 {
				t.Errorf("expected no error for email %q, got %v", tt.value, errs)
			}
		})
	}
}

func TestValidateSubmission_URL(t *testing.T) {
	tests := []struct {
		name    string
		value   string
		wantErr bool
	}{
		{"http url", "http://example.com", false},
		{"https url", "https://example.com/path", false},
		{"missing protocol", "example.com", true},
		{"ftp protocol", "ftp://example.com", true},
		{"just text", "not a url", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			form := makeForm([]models.Question{
				makeQuestion("q:1", "url", "Website", false),
			})
			req := &models.SubmissionRequest{
				Answers: []models.Answer{{QuestionID: "q:1", Value: tt.value}},
			}
			errs := ValidateSubmission(form, req)
			if tt.wantErr && len(errs) == 0 {
				t.Errorf("expected error for URL %q, got none", tt.value)
			}
			if !tt.wantErr && len(errs) > 0 {
				t.Errorf("expected no error for URL %q, got %v", tt.value, errs)
			}
		})
	}
}

func TestValidateSubmission_Rating(t *testing.T) {
	tests := []struct {
		name     string
		value    float64
		max      interface{} // nil means use default (5)
		wantErr  bool
	}{
		{"valid rating 1", 1, nil, false},
		{"valid rating 5", 5, nil, false},
		{"valid rating 3", 3, nil, false},
		{"too low", 0, nil, true},
		{"too high default", 6, nil, true},
		{"negative", -1, nil, true},
		{"custom max valid", 10, float64(10), false},
		{"custom max exceeded", 11, float64(10), true},
		{"custom max boundary", 1, float64(3), false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			q := makeQuestion("q:1", "rating", "Rate us", false)
			if tt.max != nil {
				q.Settings = map[string]interface{}{"max": tt.max}
			}
			form := makeForm([]models.Question{q})
			req := &models.SubmissionRequest{
				Answers: []models.Answer{{QuestionID: "q:1", Value: tt.value}},
			}
			errs := ValidateSubmission(form, req)
			if tt.wantErr && len(errs) == 0 {
				t.Errorf("expected error for rating %v (max=%v), got none", tt.value, tt.max)
			}
			if !tt.wantErr && len(errs) > 0 {
				t.Errorf("expected no error for rating %v (max=%v), got %v", tt.value, tt.max, errs)
			}
		})
	}
}

func TestValidateSubmission_MultipleChoice_SingleSelect(t *testing.T) {
	q := makeQuestion("q:1", "multiple_choice", "Color", false)
	q.Options = []models.ChoiceOption{
		{Key: "red", Label: "Red"},
		{Key: "blue", Label: "Blue"},
		{Key: "green", Label: "Green"},
	}

	tests := []struct {
		name    string
		value   interface{}
		wantErr bool
	}{
		{"valid option", "red", false},
		{"another valid", "blue", false},
		{"invalid option", "yellow", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			form := makeForm([]models.Question{q})
			req := &models.SubmissionRequest{
				Answers: []models.Answer{{QuestionID: "q:1", Value: tt.value}},
			}
			errs := ValidateSubmission(form, req)
			if tt.wantErr && len(errs) == 0 {
				t.Errorf("expected error for choice %v, got none", tt.value)
			}
			if !tt.wantErr && len(errs) > 0 {
				t.Errorf("expected no error for choice %v, got %v", tt.value, errs)
			}
		})
	}
}

func TestValidateSubmission_MultipleChoice_MultiSelect(t *testing.T) {
	q := makeQuestion("q:1", "multiple_choice", "Colors", false)
	q.Options = []models.ChoiceOption{
		{Key: "red", Label: "Red"},
		{Key: "blue", Label: "Blue"},
		{Key: "green", Label: "Green"},
	}
	q.Settings = map[string]interface{}{"multi_select": true}

	tests := []struct {
		name    string
		value   interface{}
		wantErr bool
	}{
		{"single valid", []interface{}{"red"}, false},
		{"multiple valid", []interface{}{"red", "blue"}, false},
		{"all valid", []interface{}{"red", "blue", "green"}, false},
		{"one invalid", []interface{}{"red", "yellow"}, true},
		{"all invalid", []interface{}{"yellow", "purple"}, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			form := makeForm([]models.Question{q})
			req := &models.SubmissionRequest{
				Answers: []models.Answer{{QuestionID: "q:1", Value: tt.value}},
			}
			errs := ValidateSubmission(form, req)
			if tt.wantErr && len(errs) == 0 {
				t.Errorf("expected error for choices %v, got none", tt.value)
			}
			if !tt.wantErr && len(errs) > 0 {
				t.Errorf("expected no error for choices %v, got %v", tt.value, errs)
			}
		})
	}
}

func TestValidateSubmission_TextMaxLength(t *testing.T) {
	for _, qtype := range []string{"text", "long_text"} {
		t.Run(qtype, func(t *testing.T) {
			q := makeQuestion("q:1", qtype, "Bio", false)
			q.Validations = map[string]interface{}{"max_length": float64(10)}

			tests := []struct {
				name    string
				value   string
				wantErr bool
			}{
				{"within limit", "short", false},
				{"at limit", "1234567890", false},
				{"exceeds limit", "12345678901", true},
			}

			for _, tt := range tests {
				t.Run(tt.name, func(t *testing.T) {
					form := makeForm([]models.Question{q})
					req := &models.SubmissionRequest{
						Answers: []models.Answer{{QuestionID: "q:1", Value: tt.value}},
					}
					errs := ValidateSubmission(form, req)
					if tt.wantErr && len(errs) == 0 {
						t.Errorf("expected error for %q (len=%d), got none", tt.value, len(tt.value))
					}
					if !tt.wantErr && len(errs) > 0 {
						t.Errorf("expected no error for %q, got %v", tt.value, errs)
					}
				})
			}
		})
	}
}

func TestValidateSubmission_GermanErrorMessages(t *testing.T) {
	// Required field
	form := makeForm([]models.Question{
		makeQuestion("q:1", "text", "Name", true),
	})
	req := &models.SubmissionRequest{Answers: []models.Answer{}}
	errs := ValidateSubmission(form, req)
	if msg, ok := errs["q:1"]; !ok || msg != "'Name' ist ein Pflichtfeld" {
		t.Errorf("expected German required error, got %q", errs["q:1"])
	}

	// Email validation
	form = makeForm([]models.Question{
		makeQuestion("q:2", "email", "Email", false),
	})
	req = &models.SubmissionRequest{
		Answers: []models.Answer{{QuestionID: "q:2", Value: "bad"}},
	}
	errs = ValidateSubmission(form, req)
	if msg, ok := errs["q:2"]; !ok || msg != "Ungültige E-Mail-Adresse" {
		t.Errorf("expected German email error, got %q", errs["q:2"])
	}
}
