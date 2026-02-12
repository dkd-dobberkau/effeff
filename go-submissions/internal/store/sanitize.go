package store

import (
	"fmt"
	"regexp"
	"strings"
)

var slugRegex = regexp.MustCompile(`^[a-z0-9][a-z0-9\-]*[a-z0-9]$`)
var recordIDRegex = regexp.MustCompile(`^(form|question|submission|form_stats):[a-zA-Z0-9]+$`)

func validateSlug(slug string) error {
	if len(slug) < 2 || len(slug) > 100 {
		return fmt.Errorf("invalid slug length: %d", len(slug))
	}
	if !slugRegex.MatchString(slug) {
		return fmt.Errorf("invalid slug format")
	}
	return nil
}

func validateRecordID(id string) error {
	if !recordIDRegex.MatchString(id) {
		return fmt.Errorf("invalid record ID format")
	}
	return nil
}

func escapeString(s string) string {
	// Remove null bytes
	s = strings.ReplaceAll(s, "\x00", "")
	// Escape backslashes first to avoid double-escaping
	s = strings.ReplaceAll(s, `\`, `\\`)
	// Escape single quotes
	s = strings.ReplaceAll(s, "'", `\'`)
	// Escape control characters
	s = strings.ReplaceAll(s, "\n", `\n`)
	s = strings.ReplaceAll(s, "\r", `\r`)
	s = strings.ReplaceAll(s, "\t", `\t`)
	return s
}
