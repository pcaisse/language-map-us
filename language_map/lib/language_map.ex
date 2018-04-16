defmodule LanguageMap do
  use Application
  # require Logger

  def start(_type, _args) do
    import Supervisor.Spec

    IO.puts("Starting Language Map...")

    children = [
      supervisor(LanguageMap.Repo, []),
      Plug.Adapters.Cowboy.child_spec(scheme: :http, plug: LanguageMap.Router, options: [port: 8080])
    ]

    Supervisor.start_link(children, strategy: :one_for_one, name: LanguageMap.Supervisor)
  end
end
