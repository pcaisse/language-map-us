defmodule LanguageMap.CachePlug do
  @moduledoc """
  A Plug used to send cached API responses if any.
  """

  use Plug.Builder
  require Logger

  plug(:get)

  def get(conn, _opts) do
    case Cachex.get(:language_map_cache, conn.query_string) do
      {:ok, nil} ->
        conn

      {:ok, json} ->
        conn
        |> put_resp_content_type("application/json")
        |> send_resp(200, json)
        |> halt

      {:error, _} ->
        Logger.error "Cache error"
        conn
    end
  end
end
