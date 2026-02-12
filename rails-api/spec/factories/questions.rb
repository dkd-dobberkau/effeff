module QuestionFactory
  def self.surreal_hash(overrides = {})
    {
      "id" => "question:q1",
      "form_id" => "form:abc123",
      "type" => "text",
      "title" => "Your Name",
      "subtitle" => nil,
      "placeholder" => "Enter your name",
      "position" => 0,
      "required" => true,
      "options" => [],
      "settings" => {},
      "validations" => {},
      "created_at" => "2025-01-01T00:00:00Z",
      "updated_at" => "2025-01-01T00:00:00Z"
    }.merge(overrides)
  end

  def self.email_hash(overrides = {})
    surreal_hash({
      "id" => "question:q2",
      "type" => "email",
      "title" => "Your Email",
      "placeholder" => "you@example.com",
      "position" => 1
    }.merge(overrides))
  end
end
