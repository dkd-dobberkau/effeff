module Api
  module V1
    class QuestionsController < ApplicationController
      before_action :find_form
      before_action :find_question, only: [:update, :destroy]

      # GET /api/v1/forms/:form_id/questions
      def index
        questions = Question.for_form(@form.id)
        render json: { questions: questions.map(&:as_json) }
      end

      # POST /api/v1/forms/:form_id/questions
      def create
        question = Question.new(question_params.merge(form_id: @form.id))
        question.save

        render json: { question: question.as_json }, status: :created
      rescue => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      # PUT /api/v1/forms/:form_id/questions/:id
      def update
        question_params.each { |k, v| @question.send("#{k}=", v) }
        @question.save

        render json: { question: @question.as_json }
      rescue => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      # DELETE /api/v1/forms/:form_id/questions/:id
      def destroy
        @question.destroy
        render json: { deleted: true }
      end

      # PUT /api/v1/forms/:form_id/questions/reorder
      def reorder
        question_ids = params.require(:question_ids)
        Question.reorder(@form.id, question_ids)
        render json: { reordered: true }
      end

      private

      def find_form
        @form = Form.find(params[:form_id])
      rescue SurrealClient::NotFoundError => e
        render json: { error: e.message }, status: :not_found
      end

      def find_question
        @question = Question.find(params[:id])
      rescue SurrealClient::NotFoundError => e
        render json: { error: e.message }, status: :not_found
      end

      def question_params
        params.require(:question).permit(
          :type, :title, :subtitle, :placeholder, :position, :required,
          options: [:key, :label],
          settings: {},
          validations: {}
        )
      end
    end
  end
end
