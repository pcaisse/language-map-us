defmodule LanguageMap.Params.Schemas.BoundingBox do
  use Ecto.Schema
  import Ecto.Changeset

  @required ~w(southwest_lng southwest_lat northeast_lng northeast_lat)a

  schema "bounding_box" do
    field :southwest_lng, :float
    field :southwest_lat, :float
    field :northeast_lng, :float
    field :northeast_lat, :float
  end

  def changeset(ch, params) do
    cast(ch, params, @required)
    |> validate_required(@required)
    |> validate_value(:southwest_lng, &valid_longitude?/1)
    |> validate_value(:northeast_lng, &valid_longitude?/1)
    |> validate_value(:southwest_lat, &valid_latitude?/1)
    |> validate_value(:northeast_lat, &valid_latitude?/1)
    |> validate_min_max_lat_lng(:southwest_lng, :northeast_lng, :southwest_lat, :northeast_lat)
  end

  defp valid_latitude?(value), do: value >= -90 and value <= 90
  defp valid_longitude?(value), do: value >= -180 and value <= 180

  defp validate_value(changeset, field, func) do
    {_, value} = fetch_field(changeset, field)
    if func.(value) do
      changeset
    else
      add_error(changeset, field, "#{field} invalid")
    end
  end

  defp validate_min_max_lat_lng(changeset, southwest_lng, northeast_lng, southwest_lat, northeast_lat) do
    {_, southwest_lng} = fetch_field(changeset, southwest_lng)
    {_, northeast_lng} = fetch_field(changeset, northeast_lng)
    {_, southwest_lat} = fetch_field(changeset, southwest_lat)
    {_, northeast_lat} = fetch_field(changeset, northeast_lat)
    if southwest_lng < northeast_lng and southwest_lat < northeast_lat do
      changeset
    else
      add_error(changeset, :southwest_lng, "Bounding box latitudes and/or longitudes are incorrect (must be of format: 'southwest_lng,southwest_lat,northeast_lng,northeast_lat')")
    end
  end
end
