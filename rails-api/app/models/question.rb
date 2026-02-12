# Question model backed by SurrealDB
class Question
  attr_accessor :id, :form_id, :type, :title, :subtitle, :placeholder,
                :position, :required, :options, :settings, :validations,
                :created_at, :updated_at

  VALID_TYPES = %w[
    welcome thank_you text email long_text multiple_choice
    rating number date url phone file_upload statement yes_no
  ].freeze

  def initialize(attrs = {})
    attrs.each { |k, v| send("#{k}=", v) if respond_to?("#{k}=") }
    @options ||= []
    @settings ||= {}
    @validations ||= {}
  end

  # ─── Finders ─────────────────────────────────────────────

  def self.find(id)
    SurrealSanitizer.validate_record_id!(id)
    record = SURREAL.query_one("SELECT * FROM #{id};")
    raise SurrealClient::NotFoundError, "Question #{id} not found" unless record
    from_surreal(record)
  end

  def self.for_form(form_id)
    SurrealSanitizer.validate_record_id!(form_id)
    records = SURREAL.query_first(
      "SELECT * FROM question WHERE form_id = #{form_id} ORDER BY position ASC;"
    )
    Array(records).map { |r| from_surreal(r) }
  end

  # ─── Persistence ─────────────────────────────────────────

  def save
    id ? update : create
  end

  def create
    SurrealSanitizer.validate_record_id!(form_id)
    raise ArgumentError, "Invalid type: #{type}" unless VALID_TYPES.include?(type)

    sql = <<~SURQL
      CREATE question SET
        form_id = #{form_id},
        type = '#{type}',
        title = '#{SurrealSanitizer.escape_string(title)}',
        subtitle = '#{SurrealSanitizer.escape_string(subtitle)}',
        placeholder = '#{SurrealSanitizer.escape_string(placeholder)}',
        position = #{position || next_position},
        required = #{required || false},
        options = #{(options || []).to_json},
        settings = #{(settings || {}).to_json},
        validations = #{(validations || {}).to_json},
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
        type = '#{type}',
        title = '#{SurrealSanitizer.escape_string(title)}',
        subtitle = '#{SurrealSanitizer.escape_string(subtitle)}',
        placeholder = '#{SurrealSanitizer.escape_string(placeholder)}',
        position = #{position},
        required = #{required},
        options = #{options.to_json},
        settings = #{settings.to_json},
        validations = #{validations.to_json},
        updated_at = time::now();
    SURQL
    SURREAL.query(sql)
    self
  end

  def destroy
    SurrealSanitizer.validate_record_id!(id)
    SURREAL.query("DELETE #{id};")
    true
  end

  # ─── Reordering ─────────────────────────────────────────

  def self.reorder(form_id, question_ids)
    SurrealSanitizer.validate_record_id!(form_id)
    question_ids.each_with_index do |qid, index|
      SurrealSanitizer.validate_record_id!(qid)
      SURREAL.query("UPDATE #{qid} SET position = #{index};")
    end
  end

  # ─── Serialization ──────────────────────────────────────

  def as_json(opts = {})
    {
      id: id,
      form_id: form_id,
      type: type,
      title: title,
      subtitle: subtitle,
      placeholder: placeholder,
      position: position,
      required: required,
      options: options,
      settings: settings,
      validations: validations,
      created_at: created_at,
      updated_at: updated_at
    }.compact
  end

  def self.from_surreal(record)
    new(
      id:          record["id"],
      form_id:     record["form_id"],
      type:        record["type"],
      title:       record["title"],
      subtitle:    record["subtitle"],
      placeholder: record["placeholder"],
      position:    record["position"],
      required:    record["required"],
      options:     record["options"],
      settings:    record["settings"],
      validations: record["validations"],
      created_at:  record["created_at"],
      updated_at:  record["updated_at"]
    )
  end

  private

  def next_position
    SurrealSanitizer.validate_record_id!(form_id)
    result = SURREAL.query_one(
      "SELECT math::max(position) AS max_pos FROM question WHERE form_id = #{form_id} GROUP ALL;"
    )
    (result&.dig("max_pos") || -1) + 1
  end
end
