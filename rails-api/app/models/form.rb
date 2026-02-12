# Form model backed by SurrealDB
class Form
  attr_accessor :id, :title, :slug, :description, :status, :theme, :settings,
                :created_at, :updated_at, :questions

  def initialize(attrs = {})
    attrs.each { |k, v| send("#{k}=", v) if respond_to?("#{k}=") }
    @questions ||= []
  end

  # ─── Finders ─────────────────────────────────────────────

  def self.all(status: nil)
    sql = if status
      SurrealSanitizer.validate_status!(status)
      "SELECT * FROM form WHERE status = '#{status}' ORDER BY created_at DESC;"
    else
      "SELECT * FROM form ORDER BY created_at DESC;"
    end
    records = SURREAL.query_first(sql)
    Array(records).map { |r| from_surreal(r) }
  end

  def self.find(id)
    SurrealSanitizer.validate_record_id!(id)
    record = SURREAL.query_one("SELECT * FROM #{id};")
    raise SurrealClient::NotFoundError, "Form #{id} not found" unless record
    from_surreal(record)
  end

  def self.find_by_slug(slug)
    SurrealSanitizer.validate_slug!(slug)
    escaped = SurrealSanitizer.escape_string(slug)
    record = SURREAL.query_one("SELECT * FROM form WHERE slug = '#{escaped}' LIMIT 1;")
    raise SurrealClient::NotFoundError, "Form with slug '#{slug}' not found" unless record
    from_surreal(record)
  end

  def self.find_by_slug_published(slug)
    SurrealSanitizer.validate_slug!(slug)
    escaped = SurrealSanitizer.escape_string(slug)
    record = SURREAL.query_one(
      "SELECT * FROM form WHERE slug = '#{escaped}' AND status = 'published' LIMIT 1;"
    )
    raise SurrealClient::NotFoundError, "Published form '#{slug}' not found" unless record
    form = from_surreal(record)
    form.load_questions!
    form
  end

  # ─── Persistence ─────────────────────────────────────────

  def save
    if id
      update
    else
      create
    end
  end

  def create
    self.slug ||= generate_slug
    sql = <<~SURQL
      CREATE form SET
        title = '#{SurrealSanitizer.escape_string(title)}',
        slug = '#{SurrealSanitizer.escape_string(slug)}',
        description = '#{SurrealSanitizer.escape_string(description)}',
        status = '#{status || 'draft'}',
        theme = #{(theme || default_theme).to_json},
        settings = #{(settings || default_settings).to_json},
        created_at = time::now(),
        updated_at = time::now();
    SURQL
    record = SURREAL.query_one(sql)
    self.id = record["id"] if record
    self
  end

  def update
    SurrealSanitizer.validate_record_id!(id)
    sql = <<~SURQL
      UPDATE #{id} SET
        title = '#{SurrealSanitizer.escape_string(title)}',
        slug = '#{SurrealSanitizer.escape_string(slug)}',
        description = '#{SurrealSanitizer.escape_string(description)}',
        status = '#{status}',
        theme = #{theme.to_json},
        settings = #{settings.to_json},
        updated_at = time::now();
    SURQL
    SURREAL.query(sql)
    self
  end

  def destroy
    SurrealSanitizer.validate_record_id!(id)
    SURREAL.query("DELETE #{id};")
    SURREAL.query("DELETE question WHERE form_id = #{id};")
    SURREAL.query("DELETE submission WHERE form_id = #{id};")
    true
  end

  # ─── Relations ───────────────────────────────────────────

  def load_questions!
    SurrealSanitizer.validate_record_id!(id)
    records = SURREAL.query_first(
      "SELECT * FROM question WHERE form_id = #{id} ORDER BY position ASC;"
    )
    self.questions = Array(records).map { |r| Question.from_surreal(r) }
    self
  end

  def submission_count
    SurrealSanitizer.validate_record_id!(id)
    result = SURREAL.query_one("SELECT count() FROM submission WHERE form_id = #{id} GROUP ALL;")
    result&.dig("count") || 0
  end

  # ─── Serialization ──────────────────────────────────────

  def as_json(opts = {})
    {
      id: id,
      title: title,
      slug: slug,
      description: description,
      status: status,
      theme: theme,
      settings: settings,
      questions: questions.map(&:as_json),
      created_at: created_at,
      updated_at: updated_at
    }.compact
  end

  def self.from_surreal(record)
    new(
      id:          record["id"],
      title:       record["title"],
      slug:        record["slug"],
      description: record["description"],
      status:      record["status"],
      theme:       record["theme"],
      settings:    record["settings"],
      created_at:  record["created_at"],
      updated_at:  record["updated_at"]
    )
  end

  private

  def generate_slug
    base = title.to_s.downcase.gsub(/[^a-z0-9]+/, "-").gsub(/^-|-$/, "")
    "#{base}-#{SecureRandom.hex(3)}"
  end

  def default_theme
    { bg_color: "#0a0a0f", accent_color: "#6c5ce7", font_family: "DM Sans", theme_mode: "dark" }
  end

  def default_settings
    { show_progress: true, allow_multiple: false }
  end
end
