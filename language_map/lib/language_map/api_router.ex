defmodule LanguageMap.APIRouter do
  use Plug.Router
  use Plug.ErrorHandler

  alias LanguageMap.{Repo}
  alias LanguageMap.{Filters}
  alias LanguageMap.Schemas.{
    PeoplePumaSummary,
    PeopleStateSummary,
    Puma,
    Language,
    State,
    English,
    Citizenship
  }
  alias LanguageMap.Params.Schemas.{Speakers, GeoJSON}
  import LanguageMap.Params.Parse, only: [
    parse_bounding_box_param: 1,
    parse_age_range_param: 1,
    parse_geometry_ids_param: 1
  ]
  import Ecto.Changeset, only: [traverse_errors: 2]

  plug :match
  plug :dispatch

  def handle_errors(conn, %{kind: _, reason: reason, stack: _}) do
    case reason do
      %Plug.BadRequestError{} -> json_encode_error(conn, reason.plug_status, reason.message)
      _ ->
        json_encode_error(conn, 500, "An unknown error has occurred")
    end
  end

  defp json_encode_error(conn, status, message) do
    json =
      %{success: false, message: message}
      |> Poison.encode!
    conn
    |> put_resp_content_type("application/json")
    |> send_resp(status, json)
  end

  defp json_encode_results(results) do
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

  @spec get_base_schema(String.t) :: Ecto.Schema
  defp get_base_schema("state"), do: PeopleStateSummary
  defp get_base_schema("puma"), do: PeoplePumaSummary

  get "/speakers/" do
    query_params = Plug.Conn.Query.decode(conn.query_string)
    bounding_box = query_params["boundingBox"] &&
        parse_bounding_box_param(query_params["boundingBox"])
    age_range = query_params["age"] &&
        parse_age_range_param(query_params["age"])
    params = %{
      level: query_params["level"],
      language: query_params["language"],
      english: query_params["english"],
      citizenship: query_params["citizenship"],
      bounding_box: bounding_box,
      age_range: age_range
    }
    changeset = Speakers.changeset(%Speakers{}, params)
    if changeset.valid? do
      schema = get_base_schema(query_params["level"])
      json =
        schema
        |> schema.group_by_area
        |> Filters.filter_by_language(query_params["language"])
        |> Filters.filter_by_english(query_params["english"])
        |> Filters.filter_by_citizenship(query_params["citizenship"])
        |> Filters.filter_by_age(age_range)
        |> schema.filter_by_bounding_box(bounding_box)
        |> schema.add_in_missing_areas(bounding_box)
        |> Repo.all
        |> json_encode_results
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
    query_params = Plug.Conn.Query.decode(conn.query_string)
    geometry_ids = parse_geometry_ids_param(query_params["ids"])
    params = %{
      level: query_params["level"],
      geometry_ids: query_params["ids"]
    }
    changeset = GeoJSON.changeset(%GeoJSON{}, params)
    if changeset.valid? do
      schema =
        case query_params["level"] do
          "puma" -> Puma
          "state" -> State
        end
      json =
        schema.get_geojson(schema)
        |> schema.filter_by_ids(geometry_ids)
        |> Repo.all
        |> Enum.map(fn row ->
          # Decode GeoJSON string so that nested JSON is properly encoded later
          Map.put(row, :geom, Poison.decode!(row.geom))
        end)
        |> json_encode_results
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

  get "/values/" do
    query_params = Plug.Conn.Query.decode(conn.query_string)
    schema =
      case query_params["filter"] do
        "language" -> Language
        "english" -> English
        "citizenship" -> Citizenship
      end
    json =
      schema.list_values()
      |> Repo.all
      |> json_encode_results
    conn
    |> put_resp_content_type("application/json")
    |> send_resp(200, json)
  end

  match _ do
    conn
    |> send_resp(404, "API endpoint not found")
  end
end
