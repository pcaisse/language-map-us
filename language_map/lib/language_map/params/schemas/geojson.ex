defmodule LanguageMap.Params.Schemas.GeoJSON do
  use Ecto.Schema
  import Ecto.Changeset
  alias LanguageMap.Params.Schemas.{BoundingBox}

  @required ~w(level)a

  schema "speakers" do
    field :level, :string
    embeds_one :bounding_box, BoundingBox
  end

  @levels ~w(state puma)

  def changeset(ch, params) do
    cast(ch, params, @required)
    |> validate_required(@required)
    |> validate_inclusion(:level, @levels, message: "must be one of: #{Enum.join(@levels, ", ")}")
    |> cast_embed(:bounding_box)
  end
end

