defmodule LanguageMap.Schemas.Params.AgeRange do
  use Ecto.Schema
  import Ecto.Changeset

  @required ~w(min max)a

  schema "age_range" do
    field :min, :integer
    field :max, :integer
  end

  @spec parse_age_range_param(String.t) :: %{} | no_return
  def parse_age_range_param(age_param) do
    try do
      age_param
      |> String.split(",")
      |> Enum.map(&String.to_integer/1)
      |> (fn [min, max] -> %{min: min, max: max} end).()
    rescue
      ArgumentError -> raise Plug.BadRequestError, message: "Invalid age range parameter"
    end
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
      add_error(changeset, min, "min must be less than or equal to max")
    end
  end
end
