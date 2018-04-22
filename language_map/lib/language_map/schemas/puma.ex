defmodule LanguageMap.Schemas.Puma do
  use Ecto.Schema
  import Ecto.Query, only: [from: 2]
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
      references: :id,
      type: :string
    ]
  end

  def get_geojson(query, "state") do
    {
      (
        from pu in query,
        select: {pu.statefp10, fragment("ST_AsGeoJSON(ST_Multi(ST_Union(geom)))")},
        group_by: pu.statefp10
      ),
      ["state", "geom"]
    }
  end

  def get_geojson(query, _) do
    {
      (
        from pu in query,
        select: {pu.statefp10, pu.pumace10, pu.geoid10, fragment("ST_AsGeoJSON(geom)")}
      ),
      ["state", "puma", "geo_id", "geom"]
    }
  end
end

