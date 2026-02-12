require_relative "../../lib/surreal_client"

# Global SurrealDB client instance
SURREAL = SurrealClient.new

Rails.logger.info "🔌 SurrealDB client initialized (#{ENV.fetch('SURREAL_HTTP_URL', 'http://localhost:8000')})"
