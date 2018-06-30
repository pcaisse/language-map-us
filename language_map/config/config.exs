use Mix.Config

config :language_map, ecto_repos: [LanguageMap.Repo]

config :language_map, LanguageMap.Repo,
  adapter: Ecto.Adapters.Postgres,
  username: System.get_env("POSTGRES_USER"),
  password: System.get_env("POSTGRES_PASSWORD"),
  database: System.get_env("POSTGRES_DB"),
  hostname: System.get_env("POSTGRES_HOST"),
  types: LanguageMap.PostgresTypes

import_config "#{Mix.env}.exs"
