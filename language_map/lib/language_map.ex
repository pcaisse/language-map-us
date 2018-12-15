defmodule LanguageMap do
  use Application
  require Logger

  def start(_type, _args) do
    import Supervisor.Spec

    Logger.info "Starting Language Map..."

    children = [
      supervisor(LanguageMap.Repo, []),
      Plug.Cowboy.child_spec(scheme: :http, plug: LanguageMap.Router, options: [
        port: 8080,
        compress: false,
      ]),
      worker(Cachex, [:language_map_cache, []])
    ]

    Supervisor.start_link(children, strategy: :one_for_one, name: LanguageMap.Supervisor)
  end
end
