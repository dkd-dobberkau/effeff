package validator

import (
	"fmt"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/dkd-dobberkau/effeff-go/internal/models"
)

var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)
var urlRegex = regexp.MustCompile(`^https?://`)

// ValidateSubmission checks all answers against the form's question definitions
func ValidateSubmission(form *models.Form, req *models.SubmissionRequest) map[string]string {
	errors := make(map[string]string)

	// Build question lookup
	questionMap := make(map[string]models.Question)
	for _, q := range form.Questions {
		questionMap[q.ID] = q
	}

	// Build answer lookup
	answerMap := make(map[string]interface{})
	for _, a := range req.Answers {
		answerMap[a.QuestionID] = a.Value
	}

	// Check required fields
	for _, q := range form.Questions {
		if q.Type == "welcome" || q.Type == "thank_you" || q.Type == "statement" {
			continue
		}

		val, answered := answerMap[q.ID]

		if q.Required && (!answered || isEmpty(val)) {
			errors[q.ID] = fmt.Sprintf("'%s' ist ein Pflichtfeld", q.Title)
			continue
		}

		if !answered || isEmpty(val) {
			continue
		}

		// Type-specific validation
		switch q.Type {
		case "email":
			if str, ok := val.(string); ok && !emailRegex.MatchString(str) {
				errors[q.ID] = "Ungültige E-Mail-Adresse"
			}

		case "url":
			if str, ok := val.(string); ok && !urlRegex.MatchString(str) {
				errors[q.ID] = "Ungültige URL"
			}

		case "rating":
			maxRating := 5
			if m, ok := q.Settings["max"]; ok {
				if mf, ok := m.(float64); ok {
					maxRating = int(mf)
				}
			}
			if num, ok := val.(float64); ok {
				if num < 1 || num > float64(maxRating) {
					errors[q.ID] = fmt.Sprintf("Bewertung muss zwischen 1 und %d liegen", maxRating)
				}
			}

		case "multiple_choice":
			multiSelect := false
			if ms, ok := q.Settings["multi_select"]; ok {
				if msb, ok := ms.(bool); ok {
					multiSelect = msb
				}
			}

			validKeys := make(map[string]bool)
			for _, opt := range q.Options {
				validKeys[opt.Key] = true
			}

			if multiSelect {
				if arr, ok := val.([]interface{}); ok {
					for _, v := range arr {
						if s, ok := v.(string); ok && !validKeys[s] {
							errors[q.ID] = fmt.Sprintf("Ungültige Option: %s", s)
						}
					}
				}
			} else {
				if str, ok := val.(string); ok && !validKeys[str] {
					errors[q.ID] = fmt.Sprintf("Ungültige Option: %s", str)
				}
			}

		case "text", "long_text":
			if str, ok := val.(string); ok {
				if maxLen, exists := q.Validations["max_length"]; exists {
					if ml, ok := maxLen.(float64); ok && len(str) > int(ml) {
						errors[q.ID] = fmt.Sprintf("Maximal %d Zeichen erlaubt", int(ml))
					}
				}
			}

		case "file_upload":
			if str, ok := val.(string); ok && str != "" {
				ext := strings.ToLower(filepath.Ext(str))
				allowed := map[string]bool{
					".pdf": true, ".doc": true, ".docx": true,
					".png": true, ".jpg": true, ".jpeg": true, ".gif": true, ".webp": true,
					".csv": true, ".xlsx": true, ".xls": true,
					".txt": true, ".zip": true,
				}
				// Check custom allowed extensions from settings
				if customExts, ok := q.Settings["allowed_extensions"]; ok {
					if arr, ok := customExts.([]interface{}); ok {
						allowed = make(map[string]bool)
						for _, e := range arr {
							if s, ok := e.(string); ok {
								allowed[strings.ToLower(s)] = true
							}
						}
					}
				}
				if !allowed[ext] {
					errors[q.ID] = fmt.Sprintf("Dateityp %s ist nicht erlaubt", ext)
				}
			}
		}
	}

	return errors
}

func isEmpty(val interface{}) bool {
	if val == nil {
		return true
	}
	switch v := val.(type) {
	case string:
		return strings.TrimSpace(v) == ""
	case []interface{}:
		return len(v) == 0
	default:
		return false
	}
}
