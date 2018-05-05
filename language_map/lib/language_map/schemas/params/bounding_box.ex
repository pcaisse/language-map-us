defmodule LanguageMap.Schemas.Params.BoundingBox do
  use Ecto.Schema
  import Ecto.Changeset

  @required ~w(left bottom right top)a

  schema "bounding_box" do
    field :left, :float
    field :bottom, :float
    field :right, :float
    field :top, :float
  end

  def changeset(ch, params) do
    cast(ch, params, @required)
    |> validate_required(@required)
    |> validate_value(:left, &valid_latitude?/1)
    |> validate_value(:right, &valid_latitude?/1)
    |> validate_value(:bottom, &valid_longitude?/1)
    |> validate_value(:top, &valid_longitude?/1)
    |> validate_min_max_lat_lng(:left, :right, :bottom, :top)
  end

  defp valid_latitude?(value), do: value > -90 and value < 90
  defp valid_longitude?(value), do: value > -180 and value < 180

  defp validate_value(changeset, field, func) do
    {_, value} = fetch_field(changeset, field)
    if func.(value) do
      changeset
    else
      add_error(changeset, field, "#{field} invalid")
    end
  end

  defp validate_min_max_lat_lng(changeset, left, right, bottom, top) do
    {_, left} = fetch_field(changeset, left)
    {_, right} = fetch_field(changeset, right)
    {_, bottom} = fetch_field(changeset, bottom)
    {_, top} = fetch_field(changeset, top)
    if left < right and bottom < top do
      changeset
    else
      add_error(changeset, :left, "Bounding box latitudes and/or longitudes are incorrect (must be of format: minimumLatitude,maximumLatitude,maximumLongitude,minimumLongitude)")
    end
  end
end
