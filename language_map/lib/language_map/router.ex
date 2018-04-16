defmodule LanguageMap.Router do
  use Plug.Router
  alias LanguageMap.{Repo, Person}
  import Ecto.Query, only: [from: 2]
  import Ecto.Query.API, only: [fragment: 1]
  import Geo.PostGIS, only: [st_intersects: 2]

  plug :match
  plug :dispatch

  get "/api/" do
    # Get coordinates from query string param
    bounding_box = Plug.Conn.Query.decode(conn.query_string)["boundingBox"]
    [left, bottom, right, top] =
      String.split(bounding_box, ",")
      |> Enum.map(&String.to_float/1)
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
    puma_speakers = Repo.all(query)
    json = Poison.encode!(
      Enum.map(puma_speakers, fn {puma, count} ->
        %{"puma": puma, "speaker_count": count}
      end)
    )
    conn
    |> put_resp_content_type("application/json")
    |> send_resp(200, json)
  end

  match _ do
    conn
    |> send_resp(404, "Not found")
  end
end
