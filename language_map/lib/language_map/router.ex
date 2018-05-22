defmodule LanguageMap.Router do
  use Plug.Router

  plug Plug.Static,
    at: "/static",
    from: :language_map
  plug :match
  plug :dispatch

  forward "/api", to: LanguageMap.APIRouter

  match _ do
    conn
    |> send_resp(404, "Not found")
  end
end
