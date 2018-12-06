defmodule LanguageMap.Params.Schemas.GeoJSON do
  use Ecto.Schema
  import Ecto.Changeset

  @required ~w(level geometry_ids)a

  schema "speakers" do
    field :level, :string
    field :geometry_ids, :string
  end

  @levels ~w(state puma)

  def changeset(ch, params) do
    cast(ch, params, @required)
    |> validate_required(@required)
    |> validate_inclusion(:level, @levels, message: "must be one of: #{Enum.join(@levels, ", ")}")
  end
end

