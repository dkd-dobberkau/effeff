module Api
  module V1
    class FilesController < ApplicationController
      # GET /api/v1/files/*path
      # Proxies file downloads from S3 (admin-only)
      def show
        file_path = params[:path]

        if file_path.blank?
          render json: { error: "File path required" }, status: :bad_request
          return
        end

        # Construct the S3 URL
        s3_endpoint = ENV.fetch("S3_ENDPOINT", "http://localhost:3900")
        s3_bucket = ENV.fetch("S3_BUCKET", "effeff-uploads")
        file_url = "#{s3_endpoint}/#{s3_bucket}/#{file_path}"

        # Proxy the file from S3
        response = HTTParty.get(file_url)

        if response.success?
          content_type = response.headers["content-type"] || "application/octet-stream"
          send_data response.body,
                    type: content_type,
                    disposition: "inline",
                    filename: File.basename(file_path)
        else
          render json: { error: "File not found" }, status: :not_found
        end
      rescue StandardError => e
        Rails.logger.error("File proxy error: #{e.message}")
        render json: { error: "Failed to fetch file" }, status: :internal_server_error
      end
    end
  end
end
