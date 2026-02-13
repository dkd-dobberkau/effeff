Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      # Auth
      namespace :auth do
        post :register
        post :login
        get :me
        get :status
      end

      resources :forms, param: :id do
        resources :questions, param: :id do
          collection do
            put :reorder
          end
        end
        member do
          get :submissions
          get :analytics
          get :export_submissions
        end
      end

      # Public endpoint: get published form by slug (no auth)
      get "forms/public/:slug", to: "forms#public_show"

      # File proxy (admin only)
      get "files/*path", to: "files#show"
    end
  end

  # Health check
  get "health", to: proc { [200, { "Content-Type" => "application/json" }, ['{"status":"healthy","service":"effeff-rails"}']] }
end
