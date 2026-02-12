require "rails_helper"

RSpec.describe Question do
  describe "VALID_TYPES" do
    it "contains 14 types" do
      expect(described_class::VALID_TYPES.length).to eq(14)
    end

    it "includes all expected types" do
      expected = %w[welcome thank_you text email long_text multiple_choice
                    rating number date url phone file_upload statement yes_no]
      expect(described_class::VALID_TYPES).to match_array(expected)
    end
  end

  describe ".from_surreal" do
    it "hydrates a Question from a hash" do
      hash = QuestionFactory.surreal_hash
      question = described_class.from_surreal(hash)

      expect(question.id).to eq("question:q1")
      expect(question.form_id).to eq("form:abc123")
      expect(question.type).to eq("text")
      expect(question.title).to eq("Your Name")
      expect(question.position).to eq(0)
      expect(question.required).to be true
      expect(question.options).to eq([])
      expect(question.settings).to eq({})
      expect(question.validations).to eq({})
    end
  end

  describe "#create" do
    it "raises ArgumentError for invalid type" do
      question = described_class.new(type: "invalid_type", form_id: "form:abc123", title: "Bad")

      expect { question.save }.to raise_error(ArgumentError, /Invalid type: invalid_type/)
    end

    it "creates with valid type" do
      question = described_class.new(
        type: "text",
        form_id: "form:abc123",
        title: "Name",
        position: 0
      )

      expect(SURREAL).to receive(:query_one)
        .with(/CREATE question SET/)
        .and_return({ "id" => "question:new1" })

      question.save
      expect(question.id).to eq("question:new1")
    end

    it "generates SQL with correct type" do
      question = described_class.new(
        type: "email",
        form_id: "form:abc123",
        title: "Email",
        position: 1
      )

      expect(SURREAL).to receive(:query_one)
        .with(/type = 'email'/)
        .and_return({ "id" => "question:new2" })

      question.save
    end
  end

  describe ".for_form" do
    it "returns questions ordered by position" do
      records = [
        QuestionFactory.surreal_hash("position" => 0),
        QuestionFactory.email_hash("position" => 1)
      ]

      allow(SURREAL).to receive(:query_first)
        .with(/WHERE form_id = form:abc123 ORDER BY position ASC/)
        .and_return(records)

      questions = described_class.for_form("form:abc123")
      expect(questions.length).to eq(2)
      expect(questions.map(&:position)).to eq([0, 1])
    end
  end

  describe ".reorder" do
    it "updates position for each question" do
      ids = ["question:q1", "question:q2", "question:q3"]

      expect(SURREAL).to receive(:query).with(/UPDATE question:q1 SET position = 0/).ordered
      expect(SURREAL).to receive(:query).with(/UPDATE question:q2 SET position = 1/).ordered
      expect(SURREAL).to receive(:query).with(/UPDATE question:q3 SET position = 2/).ordered

      described_class.reorder("form:abc123", ids)
    end
  end

  describe "#as_json" do
    it "returns a hash with expected keys" do
      question = described_class.from_surreal(QuestionFactory.surreal_hash)
      json = question.as_json

      expect(json).to include(:id, :form_id, :type, :title, :position, :required, :options)
      expect(json[:id]).to eq("question:q1")
    end
  end
end
