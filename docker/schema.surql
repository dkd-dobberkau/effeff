-- FormFlow SurrealDB Schema
-- Run: surreal import --conn http://localhost:8000 --user root --pass formflow_secret --ns formflow --db main schema.surql

-- ─── Forms ─────────────────────────────────────────────────

DEFINE TABLE form SCHEMAFULL;

DEFINE FIELD title        ON form TYPE string ASSERT $value != NONE;
DEFINE FIELD slug         ON form TYPE string ASSERT $value != NONE;
DEFINE FIELD description  ON form TYPE option<string>;
DEFINE FIELD status       ON form TYPE string DEFAULT "draft" ASSERT $value IN ["draft", "published", "archived"];
DEFINE FIELD theme        ON form FLEXIBLE TYPE object DEFAULT {
    bg_color: "#0a0a0f",
    accent_color: "#6c5ce7",
    font_family: "DM Sans",
    logo_url: NONE
};
DEFINE FIELD settings     ON form FLEXIBLE TYPE object DEFAULT {
    redirect_url: NONE,
    notify_email: NONE,
    show_progress: true,
    allow_multiple: false,
    close_date: NONE
};
DEFINE FIELD created_at   ON form TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at   ON form TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_form_slug ON form COLUMNS slug UNIQUE;
DEFINE INDEX idx_form_status ON form COLUMNS status;

-- ─── Questions ─────────────────────────────────────────────

DEFINE TABLE question SCHEMAFULL;

DEFINE FIELD form_id      ON question TYPE record<form> ASSERT $value != NONE;
DEFINE FIELD type         ON question TYPE string ASSERT $value IN [
    "welcome", "thank_you", "text", "email", "long_text",
    "multiple_choice", "rating", "number", "date", "url",
    "phone", "file_upload", "statement", "yes_no"
];
DEFINE FIELD title        ON question TYPE string ASSERT $value != NONE;
DEFINE FIELD subtitle     ON question TYPE option<string>;
DEFINE FIELD placeholder  ON question TYPE option<string>;
DEFINE FIELD position     ON question TYPE int DEFAULT 0;
DEFINE FIELD required     ON question TYPE bool DEFAULT false;
DEFINE FIELD options      ON question TYPE option<array>;   -- for multiple_choice
DEFINE FIELD options.*    ON question TYPE object;
DEFINE FIELD options.*.key   ON question TYPE string;
DEFINE FIELD options.*.label ON question TYPE string;
DEFINE FIELD settings     ON question FLEXIBLE TYPE object DEFAULT {};
-- settings examples:
--   multiple_choice: { multi_select: false }
--   rating: { max: 5, labels: { min: "Low", max: "High" } }
--   text: { max_length: 500 }
DEFINE FIELD validations  ON question FLEXIBLE TYPE object DEFAULT {};
DEFINE FIELD created_at   ON question TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at   ON question TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_question_form ON question COLUMNS form_id;
DEFINE INDEX idx_question_position ON question COLUMNS form_id, position;

-- ─── Submissions ───────────────────────────────────────────

DEFINE TABLE submission SCHEMAFULL;

DEFINE FIELD form_id      ON submission TYPE record<form> ASSERT $value != NONE;
DEFINE FIELD answers      ON submission TYPE array DEFAULT [];
-- Each answer: { question_id: record<question>, value: any }
DEFINE FIELD metadata     ON submission FLEXIBLE TYPE object DEFAULT {};
-- metadata: { ip, user_agent, referrer, duration_seconds }
DEFINE FIELD started_at   ON submission TYPE option<datetime>;
DEFINE FIELD completed_at ON submission TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_submission_form ON submission COLUMNS form_id;
DEFINE INDEX idx_submission_date ON submission COLUMNS form_id, completed_at;

-- ─── Analytics (precomputed, updated by Go service) ────────

DEFINE TABLE form_stats SCHEMAFULL;

DEFINE FIELD form_id          ON form_stats TYPE record<form> ASSERT $value != NONE;
DEFINE FIELD total_submissions ON form_stats TYPE int DEFAULT 0;
DEFINE FIELD total_started     ON form_stats TYPE int DEFAULT 0;
DEFINE FIELD avg_duration      ON form_stats TYPE float DEFAULT 0.0;
DEFINE FIELD completion_rate   ON form_stats TYPE float DEFAULT 0.0;
DEFINE FIELD updated_at        ON form_stats TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_stats_form ON form_stats COLUMNS form_id UNIQUE;

-- ─── Admin Users ─────────────────────────────────────────────

DEFINE TABLE admin_user SCHEMAFULL;

DEFINE FIELD email         ON admin_user TYPE string ASSERT $value != NONE;
DEFINE FIELD password_hash ON admin_user TYPE string ASSERT $value != NONE;
DEFINE FIELD name          ON admin_user TYPE option<string>;
DEFINE FIELD created_at    ON admin_user TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at    ON admin_user TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_admin_user_email ON admin_user COLUMNS email UNIQUE;

-- ─── Sample Data ───────────────────────────────────────────

-- Create a demo form
CREATE form SET
    title = "Feedback Formular",
    slug = "feedback-demo",
    description = "Ein kurzes Feedback-Formular als Demo.",
    status = "published",
    theme = {
        bg_color: "#0a0a0f",
        accent_color: "#6c5ce7",
        font_family: "DM Sans",
        logo_url: NONE
    };
