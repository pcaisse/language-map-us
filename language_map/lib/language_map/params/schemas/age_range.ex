defmodule LanguageMap.Params.Schemas.AgeRange do
  use Ecto.Schema
  import Ecto.Changeset

  @required ~w(min max)a

  schema "age_range" do
    field :min, :integer
    field :max, :integer
  end

  def changeset(ch, params) do
    cast(ch, params, @required)
    |> validate_required(@required)
    |> validate_min_max(:min, :max)
  end

  defp validate_min_max(changeset, min, max) do
    {_, min} = fetch_field(changeset, min)
    {_, max} = fetch_field(changeset, max)
    if min <= max do
      changeset
    else
      add_error(changeset, :min, "must be less than or equal to max")
    end
  end
end
