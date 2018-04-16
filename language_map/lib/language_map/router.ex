defmodule LanguageMap.Router do
  use Plug.Router
  alias LanguageMap.{Repo, Person}
  import Ecto.Query, only: [from: 2]
  import Ecto.Query.API, only: [fragment: 1]
  import Geo.PostGIS, only: [st_intersects: 2]

  plug :match
  plug :dispatch

  defp bounding_box(bounding_box_param) do
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

  get "/api/" do
    # Get coordinates from query string param
    query_params = Plug.Conn.Query.decode(conn.query_string)
    [left, bottom, right, top] = bounding_box(query_params["boundingBox"])
    # geom = %Geo.Point{coordinates: {39.952583, -75.165222}, srid: 4326}
    query =
      from(
        p in Person,
        join: pu in assoc(p, :puma),
        where: st_intersects(pu.geom,
          fragment("ST_MakeEnvelope(?, ?, ?, ?, 4326)", ^left, ^bottom, ^right, ^top)),
        group_by: pu.geoid10,
        select: {pu.geoid10, sum(p.weight)}
      )
    puma_speaker_counts = Repo.all(query)
    json = json_encode_results(puma_speaker_counts, ["puma", "speaker_counts"])
    conn
    |> put_resp_content_type("application/json")
    |> send_resp(200, json)
  end

  match _ do
    conn
    |> send_resp(404, "Not found")
  end
end
