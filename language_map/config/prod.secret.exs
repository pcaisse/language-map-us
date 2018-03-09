use Mix.Config

config :language_map, LanguageMap.Endpoint,
  secret_key_base: System.get_env("SECRET_KEY")

# Configure your database
config :language_map, LanguageMap.Repo,
  adapter: Ecto.Adapters.Postgres,
  username: System.get_env("POSTGRES_USER"),
  password: System.get_env("POSTGRES_PASSWORD"),
  database: System.get_env("POSTGRES_DB"),
  hostname: System.get_env("POSTGRES_HOST"),
  pool_size: 15
