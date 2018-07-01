use Mix.Config

config :language_map, ecto_repos: [LanguageMap.Repo]

config :language_map, LanguageMap.Repo,
  adapter: Ecto.Adapters.Postgres,
  username: System.get_env("POSTGRES_USER"),
  password: System.get_env("POSTGRES_PASSWORD"),
  database: "language_map_test",
  hostname: System.get_env("POSTGRES_HOST"),
  pool: Ecto.Adapters.SQL.Sandbox,
  types: LanguageMap.PostgresTypes
