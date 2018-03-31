defmodule LanguageMap do
  use Application

  def start(_type, _args) do
    import Supervisor.Spec

    children = [
      supervisor(LanguageMap.Repo, []),
    ]

    opts = [strategy: :one_for_one, name: LanguageMap.Supervisor]
    Supervisor.start_link(children, opts)
  end
end
