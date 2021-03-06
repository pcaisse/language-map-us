defmodule LanguageMap.Params.Schemas.Speakers do
  use Ecto.Schema
  import Ecto.Changeset
  alias LanguageMap.Params.Schemas.{BoundingBox, AgeRange}

  @required ~w(level language)a

  schema "speakers" do
    field :level, :string
    field :language, :string
    embeds_one :bounding_box, BoundingBox
    embeds_one :age_range, AgeRange
  end

  @levels ~w(state puma)

  def changeset(ch, params) do
    cast(ch, params, @required)
    |> validate_required(@required)
    |> validate_inclusion(:level, @levels, message: "must be one of: #{Enum.join(@levels, ", ")}")
    |> validate_length(:language, is: 4)
    |> cast_embed(:bounding_box, required: true)
    |> cast_embed(:age_range)
  end
end
