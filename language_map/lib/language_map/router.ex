defmodule LanguageMap.Router do
  use Plug.Router

  plug :match
  plug :dispatch

  get "/" do
    conn
    |> send_resp(200, "wow!")
  end

  match _ do
    conn
    |> send_resp(200, "woooow!")
  end

  def start_link do
    {:ok, _} = Plug.Adapters.Cowboy.http(LanguageMap.Router, [], port: 8080)
  end
end
