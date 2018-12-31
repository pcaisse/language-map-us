use Mix.Config

default_pool_size = 5

config :language_map, ecto_repos: [LanguageMap.Repo]

config :language_map, LanguageMap.Repo,
  adapter: Ecto.Adapters.Postgres,
  username: System.get_env("POSTGRES_USER"),
  password: System.get_env("POSTGRES_PASSWORD"),
  database: System.get_env("POSTGRES_DB"),
  hostname: System.get_env("POSTGRES_HOST"),
  pool: DBConnection.Poolboy,
  pool_size: System.get_env("POOL_SIZE") || default_pool_size,
  types: LanguageMap.PostgresTypes
