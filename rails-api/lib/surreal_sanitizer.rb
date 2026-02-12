# Central input validation and escaping for SurrealQL queries.
# SurrealDB HTTP API does not support parameterized queries,
# so we enforce strict validation + robust escaping.
module SurrealSanitizer
  class InvalidInputError < StandardError; end

  VALID_TABLES = %w[form question submission form_stats admin_user].freeze
  VALID_STATUSES = %w[draft published archived].freeze

  RECORD_ID_REGEX = /\A(#{VALID_TABLES.join("|")}):[a-zA-Z0-9]+\z/
  SLUG_REGEX = /\A[a-z0-9][a-z0-9\-]*[a-z0-9]\z/
  INTEGER_REGEX = /\A\d+\z/

  module_function

  def validate_record_id!(id)
    id = id.to_s
    unless id.match?(RECORD_ID_REGEX)
      raise InvalidInputError, "Invalid record ID: #{id.truncate(50)}"
    end
    id
  end

  def validate_slug!(slug)
    slug = slug.to_s
    unless slug.match?(SLUG_REGEX) && slug.length.between?(2, 100)
      raise InvalidInputError, "Invalid slug format"
    end
    slug
  end

  def validate_status!(status)
    status = status.to_s
    unless VALID_STATUSES.include?(status)
      raise InvalidInputError, "Invalid status: #{status}"
    end
    status
  end

  def validate_integer!(val)
    str = val.to_s
    unless str.match?(INTEGER_REGEX)
      raise InvalidInputError, "Invalid integer: #{str.truncate(20)}"
    end
    str.to_i
  end

  def validate_question_type!(type)
    unless Question::VALID_TYPES.include?(type.to_s)
      raise InvalidInputError, "Invalid question type: #{type}"
    end
    type.to_s
  end

  # Escape a string for safe embedding in single-quoted SurrealQL strings.
  # Order matters: backslashes first to avoid double-escaping.
  def escape_string(str)
    s = str.to_s
    s = s.delete("\x00")          # remove null bytes
    s = s.gsub('\\', '\\\\\\\\') # \ → \\
    s = s.gsub("'", "\\\\'")     # ' → \'
    s = s.gsub("\n", '\\n')
    s = s.gsub("\r", '\\r')
    s = s.gsub("\t", '\\t')
    s
  end
end
