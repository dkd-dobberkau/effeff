require "rails_helper"

RSpec.describe "Api::V1::Forms", type: :request do
  let(:form_hash) { FormFactory.surreal_hash }
  let(:form_with_questions) do
    form = Form.from_surreal(form_hash)
    form.questions = [Question.from_surreal(QuestionFactory.surreal_hash)]
    form
  end

  describe "GET /api/v1/forms" do
    it "returns a list of forms" do
      allow(SURREAL).to receive(:query_first).and_return([form_hash])

      get "/api/v1/forms"

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body["forms"]).to be_an(Array)
      expect(body["forms"].first["id"]).to eq("form:abc123")
    end

    it "filters by status" do
      allow(SURREAL).to receive(:query_first)
        .with(/WHERE status = 'published'/)
        .and_return([FormFactory.published_hash])

      get "/api/v1/forms", params: { status: "published" }

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body["forms"].first["status"]).to eq("published")
    end
  end

  describe "GET /api/v1/forms/public/:slug" do
    it "returns a form with questions" do
      allow(SURREAL).to receive(:query_one)
        .with(/WHERE slug = 'contact-form'/)
        .and_return(form_hash)
      allow(SURREAL).to receive(:query_first)
        .with(/WHERE form_id = form:abc123/)
        .and_return([QuestionFactory.surreal_hash])

      get "/api/v1/forms/public/contact-form"

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body["form"]["id"]).to eq("form:abc123")
      expect(body["form"]["questions"]).to be_an(Array)
    end

    it "returns 404 for missing form" do
      allow(SURREAL).to receive(:query_one).and_return(nil)

      get "/api/v1/forms/public/nonexistent"

      expect(response).to have_http_status(:not_found)
      body = JSON.parse(response.body)
      expect(body["error"]).to include("not found")
    end
  end

  describe "POST /api/v1/forms" do
    it "creates a new form" do
      allow(SURREAL).to receive(:query_one)
        .with(/CREATE form SET/)
        .and_return({ "id" => "form:new1", "title" => "New Form", "slug" => "new-form-abc123",
                      "status" => "draft", "description" => "" })

      post "/api/v1/forms", params: { form: { title: "New Form" } }, as: :json

      expect(response).to have_http_status(:created)
      body = JSON.parse(response.body)
      expect(body["form"]["id"]).to eq("form:new1")
    end
  end

  describe "PUT /api/v1/forms/:id" do
    it "updates an existing form" do
      allow(SURREAL).to receive(:query_one)
        .with(/SELECT \* FROM form:abc123/)
        .and_return(form_hash)
      allow(SURREAL).to receive(:query)
        .with(/UPDATE form:abc123 SET/)

      put "/api/v1/forms/form:abc123", params: { form: { title: "Updated" } }, as: :json

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body["form"]["title"]).to eq("Updated")
    end

    it "returns 404 for missing form" do
      allow(SURREAL).to receive(:query_one).and_return(nil)

      put "/api/v1/forms/form:missing", params: { form: { title: "X" } }, as: :json

      expect(response).to have_http_status(:not_found)
    end
  end

  describe "DELETE /api/v1/forms/:id" do
    it "deletes a form and returns confirmation" do
      allow(SURREAL).to receive(:query_one)
        .with(/SELECT \* FROM form:abc123/)
        .and_return(form_hash)
      allow(SURREAL).to receive(:query) # destroy calls query 3 times

      delete "/api/v1/forms/form:abc123"

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body["deleted"]).to be true
    end
  end

  describe "GET /api/v1/forms/:id/submissions" do
    it "returns paginated submissions" do
      allow(SURREAL).to receive(:query_one)
        .with(/SELECT \* FROM form:abc123/)
        .and_return(form_hash)

      sub_hash = {
        "id" => "submission:s1", "form_id" => "form:abc123",
        "answers" => [], "metadata" => {},
        "started_at" => "2025-01-01T00:00:00Z",
        "completed_at" => "2025-01-01T00:01:00Z"
      }
      allow(SURREAL).to receive(:query_first)
        .with(/FROM submission WHERE form_id/)
        .and_return([sub_hash])
      allow(SURREAL).to receive(:query_one)
        .with(/SELECT count\(\)/)
        .and_return({ "count" => 1 })

      get "/api/v1/forms/form:abc123/submissions"

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body["submissions"]).to be_an(Array)
      expect(body["meta"]["total"]).to eq(1)
      expect(body["meta"]["page"]).to eq(1)
    end
  end
end
