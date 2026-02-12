module Api
  module V1
    class AuthController < ApplicationController
      skip_before_action :authenticate!, only: [:login, :register, :status]

      # POST /api/v1/auth/login
      def login
        email = params[:email].to_s.strip.downcase
        password = params[:password].to_s

        if email.blank? || password.blank?
          render json: { error: "Email and password are required" }, status: :bad_request
          return
        end

        user = AdminUser.find_by_email(email)
        unless user.authenticate(password)
          render json: { error: "Invalid credentials" }, status: :unauthorized
          return
        end

        token = JwtService.encode(user.id, user.email)
        render json: { token: token, user: user.as_json }
      rescue SurrealClient::NotFoundError
        render json: { error: "Invalid credentials" }, status: :unauthorized
      end

      # POST /api/v1/auth/register
      def register
        email = params[:email].to_s.strip.downcase
        password = params[:password].to_s
        name = params[:name].to_s.strip

        if email.blank? || password.blank?
          render json: { error: "Email and password are required" }, status: :bad_request
          return
        end

        if password.length < 8
          render json: { error: "Password must be at least 8 characters" }, status: :bad_request
          return
        end

        # First user registers freely; subsequent require auth
        admin_count = AdminUser.count
        if admin_count > 0
          authenticate!
          return if performed?
        end

        user = AdminUser.create(email: email, password: password, name: name.presence)
        token = JwtService.encode(user.id, user.email)
        render json: { token: token, user: user.as_json }, status: :created
      rescue SurrealClient::QueryError => e
        if e.message.include?("idx_admin_user_email") || e.message.include?("unique")
          render json: { error: "Email already registered" }, status: :conflict
        else
          raise
        end
      end

      # GET /api/v1/auth/me
      def me
        user = AdminUser.find(@current_user_id)
        render json: { user: user.as_json }
      end

      # GET /api/v1/auth/status
      def status
        has_admin = AdminUser.count > 0
        render json: { has_admin: has_admin }
      end
    end
  end
end
