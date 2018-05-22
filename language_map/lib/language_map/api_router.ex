defmodule LanguageMap.APIRouter do
  use Plug.Router
  use Plug.ErrorHandler

  alias LanguageMap.{Repo}
  alias LanguageMap.Schemas.{Person, Puma}
  alias LanguageMap.Params.Schemas.{Speakers}
  import LanguageMap.Params.Parse, only: [
    parse_bounding_box_param: 1,
    parse_age_range_param: 1
  ]
  import Ecto.Changeset, only: [traverse_errors: 2]

  plug :match
  plug :dispatch

  def handle_errors(conn, %{kind: _kind, reason: reason, stack: _stack}) do
    json =
      %{success: false, message: reason.message}
      |> Poison.encode!
    conn
    |> put_resp_content_type("application/json")
    |> send_resp(reason.plug_status, json)
  end

  @spec json_encode_results([Ecto.Schema.t], [String.t]) :: String.t
  defp json_encode_results(rows, keys) do
    results = Enum.map(rows, fn row ->
      Enum.zip(keys, Tuple.to_list(row))
      |> Enum.into(%{})
    end)
    %{success: true, results: results}
    |> Poison.encode!
  end

  defp format_errors(changeset) do
    traverse_errors(changeset, fn {msg, opts} ->
      Enum.reduce(opts, msg, fn {key, value}, acc ->
        String.replace(acc, "%{#{key}}", to_string(value))
      end)
    end)
  end

  @spec get_base_query(String.t) :: {%Ecto.Query{}, [String.t]}
  defp get_base_query("state"), do: Person |> Person.group_by_state
  defp get_base_query("puma"), do: Person |> Person.group_by_puma

  get "/speakers/" do
    query_params = Plug.Conn.Query.decode(conn.query_string)
    bounding_box = query_params["boundingBox"] &&
        parse_bounding_box_param(query_params["boundingBox"])
    age_range = query_params["age"] &&
        parse_age_range_param(query_params["age"])
    # TODO: Handle query string like: ?language=
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
      json =
        %{success: false, errors: format_errors(changeset)}
        |> Poison.encode!
      conn
      |> put_resp_content_type("application/json")
      |> send_resp(400, json)
    end
  end

  get "/geojson/" do
    # geojson endpoints should work as follows:
    # - For states: get _simplified_ GeoJSON for all states (is slow to calculate but payload is only about 500k; can be downloaded for all states at once and saved on frontend as a static file)
    # - For PUMAs: endpoint for detailed GeoJSON data _by state_. This isn't too slow to calculate and the payload isn't too huge since it's just for a state. (Open question of whether or not multiple states' PUMAs should be returned at once.)
    # Possibly good solution for this endpoint: always pass in level, a state_id, and an optional simplification factor.
    # On frontend, cache GeoJSON for a state and only get when needed.
    query_params = Plug.Conn.Query.decode(conn.query_string)
    {query, columns} = Puma.get_geojson(Puma, query_params["level"])#, query_params["id"])
    json =
      query
      |> Repo.all
      |> Enum.map(fn row ->
        num_cols = tuple_size(row)
        # NOTE: GeoJSON column is assumed to always be last
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
    |> send_resp(404, "API endpoint not found")
  end
end
