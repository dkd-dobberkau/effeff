class ApplicationController < ActionController::API
  before_action :authenticate!

  rescue_from SurrealClient::QueryError, with: :handle_db_error
  rescue_from SurrealClient::NotFoundError, with: :handle_not_found
  rescue_from ActionController::ParameterMissing, with: :handle_bad_request
  rescue_from SurrealSanitizer::InvalidInputError, with: :handle_bad_request
  rescue_from JWT::DecodeError, with: :handle_unauthorized

  private

  def authenticate!
    token = extract_token_from_header
    unless token
      render json: { error: "Authorization token required" }, status: :unauthorized
      return
    end

    payload = JwtService.decode(token)
    @current_user_id = payload["sub"]
  rescue JWT::DecodeError => e
    render json: { error: "Invalid or expired token" }, status: :unauthorized
  end

  def extract_token_from_header
    header = request.headers["Authorization"]
    return nil unless header&.start_with?("Bearer ")
    header.split(" ", 2).last
  end

  def handle_db_error(exception)
    Rails.logger.error("SurrealDB error: #{exception.message}")
    render json: { error: "Database error", details: exception.message }, status: :internal_server_error
  end

  def handle_not_found(exception)
    render json: { error: exception.message }, status: :not_found
  end

  def handle_bad_request(exception)
    render json: { error: exception.message }, status: :bad_request
  end

  def handle_unauthorized(exception)
    render json: { error: "Invalid or expired token" }, status: :unauthorized
  end
end
