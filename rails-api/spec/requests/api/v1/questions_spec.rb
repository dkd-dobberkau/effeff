require "rails_helper"

RSpec.describe "Api::V1::Questions", type: :request do
  let(:form_hash) { FormFactory.surreal_hash("id" => "form:abc123") }
  let(:question_hash) { QuestionFactory.surreal_hash }

  before do
    # find_form before_action: stub Form.find to return a valid form
    allow(SURREAL).to receive(:query_one)
      .with(/SELECT \* FROM form:abc123/)
      .and_return(form_hash)
  end

  describe "GET /api/v1/forms/:form_id/questions" do
    it "returns questions for the form" do
      allow(SURREAL).to receive(:query_first)
        .with(/WHERE form_id = form:abc123/)
        .and_return([question_hash, QuestionFactory.email_hash])

      get "/api/v1/forms/form:abc123/questions"

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body["questions"]).to be_an(Array)
      expect(body["questions"].length).to eq(2)
    end
  end

  describe "POST /api/v1/forms/:form_id/questions" do
    it "creates a new question" do
      allow(SURREAL).to receive(:query_one)
        .with(/CREATE question SET/)
        .and_return({ "id" => "question:new1" })

      post "/api/v1/forms/form:abc123/questions",
           params: { question: { type: "text", title: "Name", position: 0 } },
           as: :json

      expect(response).to have_http_status(:created)
      body = JSON.parse(response.body)
      expect(body["question"]["id"]).to eq("question:new1")
    end

    it "returns 422 for invalid type" do
      post "/api/v1/forms/form:abc123/questions",
           params: { question: { type: "bogus", title: "Bad" } },
           as: :json

      expect(response).to have_http_status(:unprocessable_entity)
      body = JSON.parse(response.body)
      expect(body["error"]).to include("Invalid type")
    end
  end

  describe "PUT /api/v1/forms/:form_id/questions/:id" do
    it "updates a question" do
      allow(SURREAL).to receive(:query_one)
        .with(/SELECT \* FROM question:q1/)
        .and_return(question_hash)
      allow(SURREAL).to receive(:query)
        .with(/UPDATE question:q1/)

      put "/api/v1/forms/form:abc123/questions/question:q1",
          params: { question: { title: "Updated Name" } },
          as: :json

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body["question"]["title"]).to eq("Updated Name")
    end

    it "returns 404 for missing question" do
      allow(SURREAL).to receive(:query_one)
        .with(/SELECT \* FROM question:missing/)
        .and_return(nil)

      put "/api/v1/forms/form:abc123/questions/question:missing",
          params: { question: { title: "X" } },
          as: :json

      expect(response).to have_http_status(:not_found)
    end
  end

  describe "DELETE /api/v1/forms/:form_id/questions/:id" do
    it "deletes a question" do
      allow(SURREAL).to receive(:query_one)
        .with(/SELECT \* FROM question:q1/)
        .and_return(question_hash)
      allow(SURREAL).to receive(:query).with(/DELETE question:q1/)

      delete "/api/v1/forms/form:abc123/questions/question:q1"

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body["deleted"]).to be true
    end
  end

  describe "PUT /api/v1/forms/:form_id/questions/reorder" do
    it "reorders questions" do
      allow(SURREAL).to receive(:query) # reorder updates

      put "/api/v1/forms/form:abc123/questions/reorder",
          params: { question_ids: ["question:q2", "question:q1"] },
          as: :json

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body["reordered"]).to be true
    end
  end

  describe "404 for missing form" do
    it "returns 404 when form not found" do
      allow(SURREAL).to receive(:query_one).and_return(nil)

      get "/api/v1/forms/form:missing/questions"

      expect(response).to have_http_status(:not_found)
    end
  end
end
