defmodule LanguageMap.Puma do
  use Ecto.Schema


  schema "pumas" do
    field :statefp10, :string
    field :pumace10, :string
    field :affgeoid10, :string
    field :geoid10, :string
    field :name10, :string
    field :lsad10, :string
    field :aland10, :float
    field :awater10, :float
    field :geom
  end

end

