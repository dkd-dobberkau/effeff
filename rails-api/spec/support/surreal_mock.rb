# Stub the global SURREAL client so no real HTTP calls are made.
# Individual tests configure return values via:
#   allow(SURREAL).to receive(:query).and_return(...)
RSpec.configure do |config|
  config.before(:each) do
    allow(SURREAL).to receive(:query).and_return([])
    allow(SURREAL).to receive(:query_first).and_return([])
    allow(SURREAL).to receive(:query_one).and_return(nil)
    allow(SURREAL).to receive(:healthy?).and_return(true)
  end
end
