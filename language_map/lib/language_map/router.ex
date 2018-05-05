defmodule LanguageMap.Router do
  use Plug.Router
  use Plug.ErrorHandler
  alias LanguageMap.{Repo}
  alias LanguageMap.Schemas.{Person, Puma, Language, State}
  alias LanguageMap.Schemas.Params.{Speakers}
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

  @spec parse_bounding_box_param(String.t) :: %{} | no_return
  defp parse_bounding_box_param(bounding_box_param) do
    try do
      bounding_box_param
      |> String.split(",")
      |> Enum.map(&String.to_float/1)
      |> (fn ([left, bottom, right, top]) ->
        %{left: left, bottom: bottom, right: right, top: top}
      end).()
    rescue
      ArgumentError -> raise Plug.BadRequestError, message: "Bounding box values must be floats"
      FunctionClauseError -> raise Plug.BadRequestError, message: "Missing or extra bounding box values"
    end
  end

  @spec parse_age_range_param(String.t) :: %{} | no_return
  defp parse_age_range_param(age_param) do
    try do
      age_param
      |> String.split(",")
      |> Enum.map(&String.to_integer/1)
      |> (fn [min, max] -> %{min: min, max: max} end).()
    rescue
      ArgumentError -> raise Plug.BadRequestError, message: "Invalid age range parameter"
      FunctionClauseError -> raise Plug.BadRequestError, message: "Missing or extra age value"
    end
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
      errors = traverse_errors(changeset, fn {msg, opts} ->
        Enum.reduce(opts, msg, fn {key, value}, acc ->
          String.replace(acc, "%{#{key}}", to_string(value))
        end)
      end)
      json =
        %{success: false, errors: errors}
        |> Poison.encode!
      conn
      |> put_resp_content_type("application/json")
      |> send_resp(400, json)
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
