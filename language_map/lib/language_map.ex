defmodule LanguageMap do
  use Application
  # require Logger

  def start(_type, _args) do
    import Supervisor.Spec

    IO.puts("start app...")

    children = [
      worker(LanguageMap.Router, [])
    ]

    Supervisor.start_link(children, strategy: :one_for_one)
  end
end
