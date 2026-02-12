require "rails_helper"

RSpec.describe Form do
  describe ".from_surreal" do
    it "hydrates a Form from a hash" do
      hash = FormFactory.surreal_hash
      form = described_class.from_surreal(hash)

      expect(form.id).to eq("form:abc123")
      expect(form.title).to eq("Contact Form")
      expect(form.slug).to eq("contact-form-a1b2c3")
      expect(form.description).to eq("A simple contact form")
      expect(form.status).to eq("draft")
      expect(form.theme).to be_a(Hash)
      expect(form.settings).to be_a(Hash)
      expect(form.questions).to eq([])
    end
  end

  describe ".all" do
    it "queries all forms without filter" do
      records = [FormFactory.surreal_hash, FormFactory.surreal_hash("id" => "form:def456", "title" => "Survey")]
      allow(SURREAL).to receive(:query_first).and_return(records)

      forms = described_class.all
      expect(forms.length).to eq(2)
      expect(forms.first).to be_a(Form)
      expect(forms.first.title).to eq("Contact Form")
    end

    it "queries with status filter" do
      allow(SURREAL).to receive(:query_first)
        .with(/WHERE status = 'published'/)
        .and_return([FormFactory.published_hash])

      forms = described_class.all(status: "published")
      expect(forms.length).to eq(1)
      expect(forms.first.status).to eq("published")
    end

    it "returns empty array when no results" do
      allow(SURREAL).to receive(:query_first).and_return(nil)

      forms = described_class.all
      expect(forms).to eq([])
    end
  end

  describe ".find" do
    it "returns a form by ID" do
      allow(SURREAL).to receive(:query_one)
        .with(/SELECT \* FROM form:abc123/)
        .and_return(FormFactory.surreal_hash)

      form = described_class.find("form:abc123")
      expect(form.id).to eq("form:abc123")
    end

    it "raises NotFoundError when not found" do
      allow(SURREAL).to receive(:query_one).and_return(nil)

      expect { described_class.find("form:missing") }
        .to raise_error(SurrealClient::NotFoundError, /not found/)
    end
  end

  describe ".find_by_slug" do
    it "returns a form by slug" do
      allow(SURREAL).to receive(:query_one)
        .with(/WHERE slug = 'contact-form'/)
        .and_return(FormFactory.surreal_hash)

      form = described_class.find_by_slug("contact-form")
      expect(form.slug).to eq("contact-form-a1b2c3")
    end

    it "raises NotFoundError when slug not found" do
      allow(SURREAL).to receive(:query_one).and_return(nil)

      expect { described_class.find_by_slug("nonexistent") }
        .to raise_error(SurrealClient::NotFoundError)
    end
  end

  describe "#save (create)" do
    it "generates a slug from title" do
      form = described_class.new(title: "My Great Form")

      allow(SURREAL).to receive(:query_one).and_return({ "id" => "form:new1" })

      form.save
      expect(form.slug).to match(/^my-great-form-[a-f0-9]{6}$/)
      expect(form.id).to eq("form:new1")
    end

    it "sets default status to draft" do
      form = described_class.new(title: "Test")

      expect(SURREAL).to receive(:query_one)
        .with(/status = 'draft'/)
        .and_return({ "id" => "form:new2" })

      form.save
    end

    it "uses default theme and settings" do
      form = described_class.new(title: "Test")

      expect(SURREAL).to receive(:query_one)
        .with(/bg_color/)
        .and_return({ "id" => "form:new3" })

      form.save
    end
  end

  describe "#save (update)" do
    it "updates an existing form" do
      form = described_class.from_surreal(FormFactory.surreal_hash)
      form.title = "Updated Title"

      expect(SURREAL).to receive(:query)
        .with(/UPDATE form:abc123 SET/)

      form.save
    end
  end

  describe "#destroy" do
    it "deletes form, questions, and submissions" do
      form = described_class.from_surreal(FormFactory.surreal_hash)

      expect(SURREAL).to receive(:query).with(/DELETE form:abc123/).ordered
      expect(SURREAL).to receive(:query).with(/DELETE question WHERE form_id = form:abc123/).ordered
      expect(SURREAL).to receive(:query).with(/DELETE submission WHERE form_id = form:abc123/).ordered

      expect(form.destroy).to be true
    end
  end

  describe "#load_questions!" do
    it "loads and assigns questions" do
      form = described_class.from_surreal(FormFactory.surreal_hash)
      questions = [QuestionFactory.surreal_hash, QuestionFactory.email_hash]

      allow(SURREAL).to receive(:query_first)
        .with(/WHERE form_id = form:abc123 ORDER BY position/)
        .and_return(questions)

      form.load_questions!
      expect(form.questions.length).to eq(2)
      expect(form.questions.first).to be_a(Question)
      expect(form.questions.first.title).to eq("Your Name")
    end
  end

  describe "#as_json" do
    it "returns a hash with expected keys" do
      form = described_class.from_surreal(FormFactory.surreal_hash)
      json = form.as_json

      expect(json).to include(:id, :title, :slug, :description, :status, :theme, :settings, :questions)
      expect(json[:id]).to eq("form:abc123")
      expect(json[:questions]).to eq([])
    end

    it "omits nil values" do
      form = described_class.new(title: "Minimal")
      json = form.as_json

      expect(json).not_to have_key(:id)
      expect(json).to have_key(:title)
    end
  end
end
