defmodule LanguageMap.Puma do
  use Ecto.Schema


  @primary_key {:geoid10, :string, []}
  @derive {Phoenix.Param, key: :geoid10}
  schema "pumas" do
    field :statefp10, :string
    field :pumace10, :string
    field :affgeoid10, :string
    field :name10, :string
    field :lsad10, :string
    field :aland10, :float
    field :awater10, :float
    field :geom, Geo.Geometry
  end

end

