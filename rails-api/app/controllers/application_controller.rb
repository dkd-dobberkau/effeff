class ApplicationController < ActionController::API
  rescue_from SurrealClient::QueryError, with: :handle_db_error
  rescue_from SurrealClient::NotFoundError, with: :handle_not_found
  rescue_from ActionController::ParameterMissing, with: :handle_bad_request

  private

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
end
