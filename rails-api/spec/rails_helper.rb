require "spec_helper"
ENV["RAILS_ENV"] ||= "test"
require_relative "../config/environment"

require "rspec/rails"
require "webmock/rspec"

# Disable all external HTTP connections in tests
WebMock.disable_net_connect!

Dir[Rails.root.join("spec/support/**/*.rb")].each { |f| require f }

RSpec.configure do |config|
  config.infer_spec_type_from_file_location!
  config.filter_rails_from_backtrace!
end
