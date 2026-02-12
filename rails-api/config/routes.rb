Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      resources :forms, param: :id do
        resources :questions, param: :id do
          collection do
            put :reorder
          end
        end
        member do
          get :submissions
          get :analytics
        end
      end

      # Public endpoint: get form by slug for rendering
      get "forms/public/:slug", to: "forms#show"
    end
  end

  # Health check
  get "health", to: proc { [200, { "Content-Type" => "application/json" }, ['{"status":"healthy","service":"formflow-rails"}']] }
end
