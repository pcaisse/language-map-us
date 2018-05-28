defmodule LanguageMap.Schemas.State do
  use Ecto.Schema
  import Ecto.Query, only: [from: 2]
  import Geo.PostGIS, only: [st_intersects: 2]

  @primary_key {:statefp, :string, []}
  schema "states" do
    field :stusps, :string
    field :name, :string
    field :geom, Geo.PostGIS.Geometry
  end

  def get_geojson(query) do
    from s in query,
    select: %{
      state_id: s.statefp,
      geom: fragment("ST_AsGeoJSON(ST_SimplifyPreserveTopology(geom, 0.01))"),
    }
  end

  def filter_by_bounding_box(query, nil), do: query
  def filter_by_bounding_box(query, bounding_box) do
    from s in query,
    where: st_intersects(s.geom,
      fragment("ST_MakeEnvelope(?, ?, ?, ?, 4326)",
        ^bounding_box.southwest_lng,
        ^bounding_box.southwest_lat,
        ^bounding_box.northeast_lng,
        ^bounding_box.northeast_lat))
  end
end

