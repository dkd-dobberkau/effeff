# Submission model - primarily read-only from Rails side
# Submissions are created by the Go service
class Submission
  attr_accessor :id, :form_id, :answers, :metadata,
                :started_at, :completed_at

  def initialize(attrs = {})
    attrs.each { |k, v| send("#{k}=", v) if respond_to?("#{k}=") }
    @answers ||= []
    @metadata ||= {}
  end

  # ─── Finders ─────────────────────────────────────────────

  def self.for_form(form_id, limit: 50, offset: 0)
    SurrealSanitizer.validate_record_id!(form_id)
    limit = SurrealSanitizer.validate_integer!(limit)
    offset = SurrealSanitizer.validate_integer!(offset)
    records = SURREAL.query_first(
      "SELECT * FROM submission WHERE form_id = #{form_id} ORDER BY completed_at DESC LIMIT #{limit} START #{offset};"
    )
    Array(records).map { |r| from_surreal(r) }
  end

  def self.find(id)
    SurrealSanitizer.validate_record_id!(id)
    record = SURREAL.query_one("SELECT * FROM #{id};")
    raise SurrealClient::NotFoundError, "Submission #{id} not found" unless record
    from_surreal(record)
  end

  def self.count_for_form(form_id)
    SurrealSanitizer.validate_record_id!(form_id)
    result = SURREAL.query_one(
      "SELECT count() FROM submission WHERE form_id = #{form_id} GROUP ALL;"
    )
    result&.dig("count") || 0
  end

  # ─── Analytics ───────────────────────────────────────────

  def self.analytics(form_id)
    SurrealSanitizer.validate_record_id!(form_id)
    total = count_for_form(form_id)

    avg_result = SURREAL.query_one(
      "SELECT math::mean(metadata.duration_seconds) AS avg_duration FROM submission WHERE form_id = #{form_id} GROUP ALL;"
    )

    # Per-day submission counts (last 30 days)
    daily = SURREAL.query_first(<<~SURQL)
      SELECT
        time::format(completed_at, '%Y-%m-%d') AS day,
        count() AS submissions
      FROM submission
      WHERE form_id = #{form_id}
        AND completed_at > time::now() - 30d
      GROUP BY day
      ORDER BY day ASC;
    SURQL

    {
      total_submissions: total,
      avg_duration_seconds: avg_result&.dig("avg_duration")&.round(1) || 0,
      daily_submissions: Array(daily).map { |d| { date: d["day"], count: d["submissions"] } }
    }
  end

  # ─── Serialization ──────────────────────────────────────

  def as_json(opts = {})
    {
      id: id,
      form_id: form_id,
      answers: answers,
      metadata: metadata,
      started_at: started_at,
      completed_at: completed_at
    }.compact
  end

  def self.from_surreal(record)
    new(
      id:           record["id"],
      form_id:      record["form_id"],
      answers:      record["answers"],
      metadata:     record["metadata"],
      started_at:   record["started_at"],
      completed_at: record["completed_at"]
    )
  end
end
