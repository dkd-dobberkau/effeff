require "rails_helper"

RSpec.describe SurrealClient do
  let(:client) { described_class.new }
  let(:base_url) { "http://localhost:8000" }

  before do
    allow(ENV).to receive(:fetch).and_call_original
    allow(ENV).to receive(:fetch).with("SURREAL_HTTP_URL", anything).and_return(base_url)
    allow(ENV).to receive(:fetch).with("SURREAL_USER", anything).and_return("root")
    allow(ENV).to receive(:fetch).with("SURREAL_PASS", anything).and_return("secret")
    allow(ENV).to receive(:fetch).with("SURREAL_NS", anything).and_return("formflow")
    allow(ENV).to receive(:fetch).with("SURREAL_DB", anything).and_return("main")
  end

  describe "#query" do
    it "sends POST to /sql with correct headers and auth" do
      stub = stub_request(:post, "#{base_url}/sql")
        .with(
          body: "SELECT * FROM form;",
          headers: {
            "Content-Type" => "application/json",
            "Accept" => "application/json",
            "surreal-ns" => "formflow",
            "surreal-db" => "main"
          },
          basic_auth: ["root", "secret"]
        )
        .to_return(
          status: 200,
          body: [{ "result" => [{ "id" => "form:1" }], "status" => "OK" }].to_json,
          headers: { "Content-Type" => "application/json" }
        )

      result = client.query("SELECT * FROM form;")

      expect(stub).to have_been_requested
      expect(result).to eq([[{ "id" => "form:1" }]])
    end

    it "raises QueryError on non-200 response" do
      stub_request(:post, "#{base_url}/sql")
        .to_return(status: 500, body: "Internal error")

      expect { client.query("BAD SQL") }.to raise_error(SurrealClient::QueryError, /HTTP 500/)
    end

    it "raises QueryError on invalid JSON response" do
      stub_request(:post, "#{base_url}/sql")
        .to_return(status: 200, body: "not json")

      expect { client.query("SELECT 1;") }.to raise_error(SurrealClient::QueryError, /parse/)
    end
  end

  describe "#query_first" do
    it "returns the first result set" do
      stub_request(:post, "#{base_url}/sql")
        .to_return(
          status: 200,
          body: [
            { "result" => [{ "id" => "form:1" }, { "id" => "form:2" }], "status" => "OK" }
          ].to_json
        )

      result = client.query_first("SELECT * FROM form;")
      expect(result).to eq([{ "id" => "form:1" }, { "id" => "form:2" }])
    end

    it "returns empty array when no results" do
      stub_request(:post, "#{base_url}/sql")
        .to_return(status: 200, body: [].to_json)

      result = client.query_first("SELECT * FROM form;")
      expect(result).to eq([])
    end
  end

  describe "#query_one" do
    it "returns single record from first result set" do
      stub_request(:post, "#{base_url}/sql")
        .to_return(
          status: 200,
          body: [{ "result" => [{ "id" => "form:1", "title" => "Test" }], "status" => "OK" }].to_json
        )

      result = client.query_one("SELECT * FROM form:1;")
      expect(result).to eq({ "id" => "form:1", "title" => "Test" })
    end

    it "returns nil when no records" do
      stub_request(:post, "#{base_url}/sql")
        .to_return(status: 200, body: [{ "result" => [], "status" => "OK" }].to_json)

      result = client.query_one("SELECT * FROM form:none;")
      expect(result).to be_nil
    end
  end

  describe "#healthy?" do
    it "returns true when health endpoint responds 200" do
      stub_request(:get, "#{base_url}/health").to_return(status: 200)
      expect(client.healthy?).to be true
    end

    it "returns false when health endpoint fails" do
      stub_request(:get, "#{base_url}/health").to_return(status: 503)
      expect(client.healthy?).to be false
    end

    it "returns false on network error" do
      stub_request(:get, "#{base_url}/health").to_raise(Errno::ECONNREFUSED)
      expect(client.healthy?).to be false
    end
  end
end
