defmodule LanguageMap.Router do
  use Plug.Router
  alias LanguageMap.{Repo, BoundingBox}
  alias LanguageMap.Schemas.{Person, Puma, Language, State}

  plug :match
  plug :dispatch

  @spec get_bounding_box(String.t) :: BoundingBox.t
  defp get_bounding_box(bounding_box_param) do
    bounding_box_param
    |> String.split(",")
    |> Enum.map(&String.to_float/1)
    |> (fn ([left, bottom, right, top]) ->
      %BoundingBox{left: left, bottom: bottom, right: right, top: top}
    end).()
  end

  @spec get_age_range(nil) :: nil
  @spec get_age_range(String) :: [integer]
  defp get_age_range(""), do: nil
  defp get_age_range(nil), do: nil
  defp get_age_range(age_param) do
    age_param
    |> String.split(",")
    |> Enum.map(&String.to_integer/1)
  end

  @spec json_encode_results([Ecto.Schema.t], [String.t]) :: String.t
  defp json_encode_results(results, keys) do
    Enum.map(results, fn row ->
      Enum.zip(keys, Tuple.to_list(row))
      |> Enum.into(%{})
    end)
    |> Poison.encode!
  end

  @spec get_base_query(String.t, String | nil) :: {%Ecto.Query{}, [String.t]}
  defp get_base_query("state", _) do
    Person
    |> Person.group_by_state
  end
  defp get_base_query(_, bounding_box_param) do
    bounding_box = get_bounding_box(bounding_box_param)
    Person
    |> Person.filter_by_bounding_box(bounding_box)
    |> Person.group_by_puma
  end

  get "/speakers/" do
    query_params = Plug.Conn.Query.decode(conn.query_string)
    {query, columns} = get_base_query(query_params["level"], query_params["boundingBox"])
    json =
      query
      |> Person.filter_by_language(query_params["language"])
      |> Person.filter_by_age(get_age_range(query_params["age"]))
      |> Repo.all
      |> json_encode_results(columns)
    conn
    |> put_resp_content_type("application/json")
    |> send_resp(200, json)
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
