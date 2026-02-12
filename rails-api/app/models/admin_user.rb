require "bcrypt"

# Admin user model backed by SurrealDB
class AdminUser
  attr_accessor :id, :email, :password_hash, :name, :created_at, :updated_at

  def initialize(attrs = {})
    attrs.each { |k, v| send("#{k}=", v) if respond_to?("#{k}=") }
  end

  # ─── Finders ─────────────────────────────────────────────

  def self.find(id)
    SurrealSanitizer.validate_record_id!(id)
    record = SURREAL.query_one("SELECT * FROM #{id};")
    raise SurrealClient::NotFoundError, "Admin user not found" unless record
    from_surreal(record)
  end

  def self.find_by_email(email)
    escaped = SurrealSanitizer.escape_string(email.to_s.strip.downcase)
    record = SURREAL.query_one("SELECT * FROM admin_user WHERE email = '#{escaped}' LIMIT 1;")
    raise SurrealClient::NotFoundError, "Admin user not found" unless record
    from_surreal(record)
  end

  def self.count
    result = SURREAL.query_one("SELECT count() FROM admin_user GROUP ALL;")
    result&.dig("count") || 0
  end

  # ─── Persistence ─────────────────────────────────────────

  def self.create(email:, password:, name: nil)
    escaped_email = SurrealSanitizer.escape_string(email.strip.downcase)
    escaped_name = SurrealSanitizer.escape_string(name.to_s)
    hashed = BCrypt::Password.create(password)

    sql = <<~SURQL
      CREATE admin_user SET
        email = '#{escaped_email}',
        password_hash = '#{SurrealSanitizer.escape_string(hashed.to_s)}',
        name = '#{escaped_name}',
        created_at = time::now(),
        updated_at = time::now();
    SURQL
    record = SURREAL.query_one(sql)
    raise SurrealClient::QueryError, "Failed to create admin user" unless record
    from_surreal(record)
  end

  # ─── Authentication ─────────────────────────────────────

  def authenticate(password)
    BCrypt::Password.new(password_hash) == password
  end

  # ─── Serialization ──────────────────────────────────────

  def as_json(opts = {})
    {
      id: id,
      email: email,
      name: name,
      created_at: created_at,
      updated_at: updated_at
    }.compact
  end

  def self.from_surreal(record)
    new(
      id:            record["id"],
      email:         record["email"],
      password_hash: record["password_hash"],
      name:          record["name"],
      created_at:    record["created_at"],
      updated_at:    record["updated_at"]
    )
  end
end
