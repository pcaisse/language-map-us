defmodule LanguageMap.Schemas.PeoplePumaSummary do
  @moduledoc """
  Summarizes data in `people` table by aggregating weights across filters,
  rolling up to the PUMA level.
  """
  use Ecto.Schema
  import Ecto.Query, only: [from: 2, subquery: 1]
  import Geo.PostGIS, only: [st_intersects: 2]
  alias LanguageMap.Schemas.{Puma}

  defmacro make_bounding_box(southwest_lng, southwest_lat, northeast_lng, northeast_lat) do
    quote do
      fragment("ST_MakeEnvelope(?, ?, ?, ?, 4326)",
        unquote(southwest_lng),
        unquote(southwest_lat),
        unquote(northeast_lng),
        unquote(northeast_lat))
    end
  end

  schema "people_summary" do
    field :age, :integer
    field :sum_weight, :integer
    field :english_id, :integer
    field :language_id, :integer
    field :citizenship_id, :integer
    field :state_id, :string
    field :geo_id, :string
  end

  def filter_by_bounding_box(query, nil), do: query
  def filter_by_bounding_box(query, bounding_box) do
    from p in query,
    join: pu in Puma, on: p.geo_id == pu.geoid10,
    where: st_intersects(pu.geom, make_bounding_box(
      ^bounding_box.southwest_lng,
      ^bounding_box.southwest_lat,
      ^bounding_box.northeast_lng,
      ^bounding_box.northeast_lat))

  end

  defmacrop puma_percentage(sum_weight, geo_id) do
    quote do
      fragment(
        "sum(?) / (select sum(sum_weight) from people_summary where geo_id = ?)",
        unquote(sum_weight), unquote(geo_id))
    end
  end

  def group_by_area(query) do
    from p in query,
    group_by: p.geo_id,
    select: %{
      geo_id: p.geo_id,
      sum_weight: sum(p.sum_weight),
    }
  end

  def add_in_missing_areas(query, bounding_box) do
    from p in subquery(query),
    right_join: pu in Puma, on: p.geo_id == pu.geoid10,
    where: st_intersects(pu.geom, make_bounding_box(
      ^bounding_box.southwest_lng,
      ^bounding_box.southwest_lat,
      ^bounding_box.northeast_lng,
      ^bounding_box.northeast_lat)),
    select: %{
      geo_id: pu.geoid10,
      sum_weight: p.sum_weight,
      percentage: puma_percentage(p.sum_weight, pu.geoid10),
    },
    group_by: [p.sum_weight, pu.geoid10]
  end
end

