defmodule LanguageMap.Router do
  use Plug.Router
  alias LanguageMap.{Repo, Person, Puma}

  plug :match
  plug :dispatch

  defp get_bounding_box(bounding_box_param) do
    bounding_box_param
    |> String.split(",")
    |> Enum.map(&String.to_float/1)
  end

  defp json_encode_results(results, keys) do
    Enum.map(results, fn row ->
      Enum.zip(keys, Tuple.to_list(row))
      |> Enum.into(%{})
      |> Poison.encode!
    end)
  end

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
      |> Repo.all
      |> json_encode_results(columns)
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
