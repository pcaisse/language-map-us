defmodule LanguageMap.APIRouter do
  use Plug.Router
  use Plug.ErrorHandler

  alias LanguageMap.{Repo}
  alias LanguageMap.Schemas.{PeopleSummary, Puma, Language, State, English, Citizenship}
  alias LanguageMap.Params.Schemas.{Speakers, GeoJSON}
  import LanguageMap.Params.Parse, only: [
    parse_bounding_box_param: 1,
    parse_age_range_param: 1
  ]
  import Ecto.Changeset, only: [traverse_errors: 2]

  plug :match
  plug :dispatch

  # TODO: Handle non Plug.BadRequestErrors correctly
  def handle_errors(conn, %{kind: _kind, reason: reason, stack: _stack}) do
    json =
      %{success: false, message: reason.message}
      |> Poison.encode!
    conn
    |> put_resp_content_type("application/json")
    |> send_resp(reason.plug_status, json)
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

  @spec get_base_query(String.t) :: {%Ecto.Query{}, [String.t]}
  defp get_base_query("state"), do: PeopleSummary |> PeopleSummary.group_by_state
  defp get_base_query("puma"), do: PeopleSummary |> PeopleSummary.group_by_puma

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
      json =
        get_base_query(query_params["level"])
        |> PeopleSummary.filter_by_language(query_params["language"])
        |> PeopleSummary.filter_by_age(age_range)
        |> PeopleSummary.filter_by_bounding_box(bounding_box, query_params["level"])
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
    bounding_box = query_params["boundingBox"] &&
        parse_bounding_box_param(query_params["boundingBox"])
    params = %{
      level: query_params["level"],
      bounding_box: bounding_box
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
        |> schema.filter_by_bounding_box(bounding_box)
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
