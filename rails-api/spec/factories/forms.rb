module FormFactory
  def self.surreal_hash(overrides = {})
    {
      "id" => "form:abc123",
      "title" => "Contact Form",
      "slug" => "contact-form-a1b2c3",
      "description" => "A simple contact form",
      "status" => "draft",
      "theme" => { "bg_color" => "#0a0a0f", "accent_color" => "#6c5ce7", "font_family" => "DM Sans" },
      "settings" => { "show_progress" => true, "allow_multiple" => false },
      "created_at" => "2025-01-01T00:00:00Z",
      "updated_at" => "2025-01-01T00:00:00Z"
    }.merge(overrides)
  end

  def self.published_hash(overrides = {})
    surreal_hash({ "status" => "published" }.merge(overrides))
  end
end
