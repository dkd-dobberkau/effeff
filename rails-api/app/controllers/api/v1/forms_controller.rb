module Api
  module V1
    class FormsController < ApplicationController
      skip_before_action :authenticate!, only: [:public_show]
      before_action :find_form, only: [:show, :update, :destroy, :submissions, :analytics, :export_submissions]

      # GET /api/v1/forms
      def index
        forms = Form.all(status: params[:status])
        render json: { forms: forms.map(&:as_json) }
      end

      # GET /api/v1/forms/:id
      def show
        @form.load_questions!
        render json: { form: @form.as_json }
      end

      # GET /api/v1/forms/public/:slug (no auth required)
      def public_show
        slug = params[:slug]
        form = Form.find_by_slug_published(slug)
        render json: { form: form.as_json }
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

      # GET /api/v1/forms/:id/export_submissions
      def export_submissions
        @form.load_questions!
        question_map = @form.questions.each_with_object({}) do |q, map|
          map[q.id] = { title: q.title, type: q.type }
        end

        subs = Submission.all_for_form(@form.id)

        submissions = subs.map do |sub|
          resolved = Array(sub.answers).map do |a|
            qid = a["question_id"]
            q_info = question_map[qid] || { title: qid, type: "unknown" }
            {
              question_id: qid,
              question_title: q_info[:title],
              question_type: q_info[:type],
              value: a["value"]
            }
          end

          {
            id: sub.id,
            completed_at: sub.completed_at,
            started_at: sub.started_at,
            duration_seconds: sub.metadata&.dig("duration_seconds"),
            resolved_answers: resolved
          }
        end

        render json: {
          form_title: @form.title,
          questions: @form.questions.map { |q| { id: q.id, title: q.title, type: q.type } },
          submissions: submissions
        }
      end

      # GET /api/v1/forms/:id/analytics
      def analytics
        stats = Submission.analytics(@form.id)
        render json: { analytics: stats }
      end

      private

      def find_form
        identifier = params[:id]
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
