# This file is responsible for configuring your application
# and its dependencies with the aid of the Mix.Config module.
#
# This configuration file is loaded before any dependency and
# is restricted to this project.
use Mix.Config

# General application configuration
config :language_map,
  ecto_repos: [LanguageMap.Repo]

# Configures the endpoint
config :language_map, LanguageMap.Endpoint,
  url: [host: "localhost"],
  secret_key_base: "YikkheeZcLDXR+4Q6WtM9xm9gLT7jCFOujp+kn5S0MwTdLFYR6slTOtGbXenLD5G",
  render_errors: [view: LanguageMap.ErrorView, accepts: ~w(html json)],
  pubsub: [name: LanguageMap.PubSub,
           adapter: Phoenix.PubSub.PG2]

# Configures Elixir's Logger
config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
import_config "#{Mix.env}.exs"
