require "httparty"
require "json"

# SurrealDB HTTP client for Rails
# Uses the REST API since the Ruby SDK is still maturing
class SurrealClient
  include HTTParty

  class QueryError < StandardError; end
  class NotFoundError < StandardError; end

  def initialize
    @base_url = ENV.fetch("SURREAL_HTTP_URL", "http://localhost:8000")
    @user     = ENV.fetch("SURREAL_USER", "root")
    @pass     = ENV.fetch("SURREAL_PASS", "effeff_secret")
    @ns       = ENV.fetch("SURREAL_NS", "effeff")
    @db       = ENV.fetch("SURREAL_DB", "main")
  end

  # Execute a SurrealQL query
  def query(sql, vars = {})
    response = self.class.post(
      "#{@base_url}/sql",
      body: sql,
      headers: headers,
      basic_auth: auth
    )

    raise QueryError, "HTTP #{response.code}: #{response.body}" unless response.success?

    results = JSON.parse(response.body)
    results.map { |r| r["result"] }
  rescue JSON::ParserError => e
    raise QueryError, "Failed to parse response: #{e.message}"
  end

  # Convenience: query and return first result set
  def query_first(sql, vars = {})
    results = query(sql, vars)
    results&.first || []
  end

  # Convenience: query and return single record
  def query_one(sql, vars = {})
    records = query_first(sql, vars)
    records.is_a?(Array) ? records.first : records
  end

  def healthy?
    response = self.class.get("#{@base_url}/health")
    response.success?
  rescue StandardError
    false
  end

  private

  def headers
    {
      "Content-Type" => "application/json",
      "Accept"       => "application/json",
      "surreal-ns"   => @ns,
      "surreal-db"   => @db
    }
  end

  def auth
    { username: @user, password: @pass }
  end
end
