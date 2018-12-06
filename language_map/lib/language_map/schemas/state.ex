defmodule LanguageMap.Schemas.State do
  use Ecto.Schema
  import Ecto.Query, only: [from: 2]

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
      stusps: s.stusps,
      name: s.name,
    }
  end

  def filter_by_ids(query, nil), do: query
  def filter_by_ids(query, ids) do
    from s in query,
    where: s.statefp in ^ids
  end
end

