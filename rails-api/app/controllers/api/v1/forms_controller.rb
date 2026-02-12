module Api
  module V1
    class FormsController < ApplicationController
      before_action :find_form, only: [:show, :update, :destroy, :submissions, :analytics]

      # GET /api/v1/forms
      def index
        forms = Form.all(status: params[:status])
        render json: { forms: forms.map(&:as_json) }
      end

      # GET /api/v1/forms/:slug
      def show
        @form.load_questions!
        render json: { form: @form.as_json }
      end

      # POST /api/v1/forms
      def create
        form = Form.new(form_params)
        form.save

        render json: { form: form.as_json }, status: :created
      rescue => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      # PUT /api/v1/forms/:id
      def update
        form_params.each { |k, v| @form.send("#{k}=", v) }
        @form.save

        render json: { form: @form.as_json }
      rescue => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      # DELETE /api/v1/forms/:id
      def destroy
        @form.destroy
        render json: { deleted: true }
      end

      # GET /api/v1/forms/:id/submissions
      def submissions
        page = (params[:page] || 1).to_i
        per_page = (params[:per_page] || 50).to_i
        offset = (page - 1) * per_page

        subs = Submission.for_form(@form.id, limit: per_page, offset: offset)
        total = Submission.count_for_form(@form.id)

        render json: {
          submissions: subs.map(&:as_json),
          meta: { total: total, page: page, per_page: per_page }
        }
      end

      # GET /api/v1/forms/:id/analytics
      def analytics
        stats = Submission.analytics(@form.id)
        render json: { analytics: stats }
      end

      private

      def find_form
        identifier = params[:id] || params[:slug]
        @form = if identifier.to_s.start_with?("form:")
          Form.find(identifier)
        else
          Form.find_by_slug(identifier)
        end
      rescue SurrealClient::NotFoundError => e
        render json: { error: e.message }, status: :not_found
      end

      def form_params
        params.require(:form).permit(:title, :slug, :description, :status,
          theme: {}, settings: {})
      end
    end
  end
end
