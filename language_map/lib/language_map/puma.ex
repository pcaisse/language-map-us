defmodule LanguageMap.Puma do
  use Ecto.Schema
  import Ecto.Query, only: [from: 2]


  @primary_key {:geoid10, :string, []}
  schema "pumas" do
    field :pumace10, :string
    field :affgeoid10, :string
    field :name10, :string
    field :lsad10, :string
    field :aland10, :float
    field :awater10, :float
    field :geom, Geo.PostGIS.Geometry
    belongs_to :state, LanguageMap.State, [
      foreign_key: :statefp10,
      references: :id,
      type: :string
    ]
  end

  def get_geojson(query) do
    {
      (
        from pu in query,
        select: {pu.statefp10, pu.pumace10, pu.geoid10, fragment("ST_AsGeoJSON(geom)")}
      ),
      ["state", "puma", "geo_id", "geom"]
    }
  end
end

