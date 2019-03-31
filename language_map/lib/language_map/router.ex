defmodule LanguageMap.Router do
  use Plug.Router

  plug Plug.AccessLog,
    format: :combined,
    fun: &InfoLogger.log/1

  plug Plug.Static,
    at: "/static",
    from: :language_map
  plug :match
  plug :dispatch

  forward "/api", to: LanguageMap.APIRouter

  get "/" do
    send_file(conn, 200, "priv/static/index.html")
  end

  match _ do
    conn
    |> send_resp(404, "Not found")
  end
end
