defmodule LanguageMap.Router do
  use Plug.Router
  alias LanguageMap.{Repo, Person}
  import Ecto.Query, only: [from: 2]
  import Ecto.Query.API, only: [fragment: 1]
  import Geo.PostGIS, only: [st_intersects: 2]

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

  defp build_query([left, bottom, right, top]) do
    from p in Person,
    join: pu in assoc(p, :puma),
    where: st_intersects(pu.geom,
      fragment("ST_MakeEnvelope(?, ?, ?, ?, 4326)", ^left, ^bottom, ^right, ^top)),
    group_by: pu.geoid10,
    select: {pu.geoid10, sum(p.weight)}
  end

  defp filter_by_language(query, nil), do: query
  defp filter_by_language(query, ""), do: query
  defp filter_by_language(query, language) do
    from p in query,
    join: l in assoc(p, :language),
    where: l.id == ^language
  end

  get "/api/" do
    query_params = Plug.Conn.Query.decode(conn.query_string)
    json =
      query_params["boundingBox"]
      |> get_bounding_box
      |> build_query
      |> filter_by_language(query_params["language"])
      |> Repo.all
      |> json_encode_results(["puma", "speaker_counts"])
    conn
    |> put_resp_content_type("application/json")
    |> send_resp(200, json)
  end

  match _ do
    conn
    |> send_resp(404, "Not found")
  end
end
