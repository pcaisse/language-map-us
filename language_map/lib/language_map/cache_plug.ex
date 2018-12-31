defmodule LanguageMap.CachePlug do
  @moduledoc """
  A Plug used to send cached API responses if any.
  """

  use Plug.Builder
  require Logger

  plug(:get)

  def get(conn, _opts) do
    # NOTE: Can explicitly disable cache for testing purposes
    if System.get_env("DISABLE_CACHE") do
      Logger.info "Ignoring cache"
      conn
    else
      case Cachex.get(:language_map_cache, conn.query_string) do
        {:ok, nil} ->
          Logger.info "No cache hit for query string: #{conn.query_string}"
          conn

        {:ok, json} ->
          Logger.info "Returning cached response for query string: #{conn.query_string}"
          conn
          |> put_resp_content_type("application/json")
          |> send_resp(200, json)
          |> halt

        {:error, msg} ->
          Logger.error "Cache error: #{inspect(msg)}"
          conn
      end
    end
  end
end
