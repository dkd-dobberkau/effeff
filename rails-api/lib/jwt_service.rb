require "jwt"

module JwtService
  ALGORITHM = "HS256"
  EXPIRATION = 24 * 60 * 60 # 24 hours

  module_function

  def secret
    ENV.fetch("JWT_SECRET") { raise "JWT_SECRET environment variable is not set" }
  end

  def encode(user_id, email)
    payload = {
      sub: user_id,
      email: email,
      iat: Time.now.to_i,
      exp: Time.now.to_i + EXPIRATION
    }
    JWT.encode(payload, secret, ALGORITHM)
  end

  def decode(token)
    decoded = JWT.decode(token, secret, true, algorithm: ALGORITHM)
    decoded.first
  end
end
