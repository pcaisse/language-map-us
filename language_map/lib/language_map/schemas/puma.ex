defmodule LanguageMap.Schemas.Puma do
  use Ecto.Schema
  import Ecto.Query, only: [from: 2]
  import Geo.PostGIS, only: [st_intersects: 2]
  alias LanguageMap.Schemas.{State}


  @primary_key {:geoid10, :string, []}
  schema "pumas" do
    field :pumace10, :string
    field :affgeoid10, :string
    field :name10, :string
    field :lsad10, :string
    field :aland10, :float
    field :awater10, :float
    field :geom, Geo.PostGIS.Geometry
    belongs_to :state, State, [
      foreign_key: :statefp10,
      references: :statefp,
      type: :string
    ]
  end

  def get_geojson(query) do
    from pu in query,
    select: %{
      geo_id: pu.geoid10,
      geom: fragment("ST_AsGeoJSON(geom)"),
    }
  end

  def filter_by_bounding_box(query, nil), do: query
  def filter_by_bounding_box(query, bounding_box) do
    from pu in query,
    where: st_intersects(pu.geom,
      fragment("ST_MakeEnvelope(?, ?, ?, ?, 4326)",
        ^bounding_box.southwest_lng,
        ^bounding_box.southwest_lat,
        ^bounding_box.northeast_lng,
        ^bounding_box.northeast_lat))
  end
end

