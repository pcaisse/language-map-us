defmodule LanguageMap.Router do
  use Plug.Router
  use Plug.ErrorHandler
  alias LanguageMap.{Repo}
  alias LanguageMap.Schemas.{Person, Puma, Language, State}
  alias LanguageMap.Schemas.Params.{BoundingBox, Speakers, AgeRange}

  plug :match
  plug :dispatch

  def handle_errors(conn, %{kind: _kind, reason: reason, stack: _stack}) do
    send_resp(conn, conn.status, reason.message)
  end

  @spec json_encode_results([Ecto.Schema.t], [String.t]) :: String.t
  defp json_encode_results(results, keys) do
    Enum.map(results, fn row ->
      Enum.zip(keys, Tuple.to_list(row))
      |> Enum.into(%{})
    end)
    |> Poison.encode!
  end

  @spec get_base_query(String.t) :: {%Ecto.Query{}, [String.t]}
  defp get_base_query("state"), do: Person |> Person.group_by_state
  defp get_base_query("puma"), do: Person |> Person.group_by_puma

  get "/speakers/" do
    query_params = Plug.Conn.Query.decode(conn.query_string)
    bounding_box = query_params["boundingBox"] &&
        BoundingBox.parse_bounding_box_param(query_params["boundingBox"])
    age_range = query_params["age"] &&
        AgeRange.parse_age_range_param(query_params["age"])
    params = %{
      level: query_params["level"],
      language: query_params["language"],
      bounding_box: bounding_box,
      age_range: age_range
    }
    changeset = Speakers.changeset(%Speakers{}, params)
    if changeset.valid? do
      {query, columns} = get_base_query(query_params["level"])
      json =
        query
        |> Person.filter_by_bounding_box(bounding_box)
        |> Person.filter_by_language(query_params["language"])
        |> Person.filter_by_age(age_range)
        |> Repo.all
        |> json_encode_results(columns)
      conn
      |> put_resp_content_type("application/json")
      |> send_resp(200, json)
    else
      conn
      |> send_resp(400, changeset.errors)
    end
  end

  get "/list_values/" do
    query_params = Plug.Conn.Query.decode(conn.query_string)
    schema =
      case query_params["schema"] do
        "language" -> Language
        "state" -> State
      end
    json =
      schema.list_values
      |> Repo.all
      |> Enum.map(&Tuple.to_list/1)
      |> Poison.encode!
    conn
    |> put_resp_content_type("application/json")
    |> send_resp(200, json)
  end

  get "/geojson/" do
    query_params = Plug.Conn.Query.decode(conn.query_string)
    {query, columns} = Puma.get_geojson(Puma, query_params["level"])
    json =
      query
      |> Repo.all
      |> Enum.map(fn row ->
        num_cols = tuple_size(row)
        # Note: GeoJSON column is assumed to always be last
        last_index = num_cols - 1
        # Decode GeoJSON string so that nested JSON is properly encoded later
        geo_json = elem(row, last_index)
        put_elem(row, last_index, Poison.decode!(geo_json))
      end)
      |> json_encode_results(columns)
    conn
    |> put_resp_content_type("application/json")
    |> send_resp(200, json)
  end

  match _ do
    conn
    |> send_resp(404, "Not found")
  end
end
