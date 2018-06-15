defmodule LanguageMap.Schemas.PeopleSummary do
  @moduledoc """
  Summarizes data in `people` table by aggregating weights across filters.
  """
  use Ecto.Schema
  import Ecto.Query, only: [from: 2]
  import Geo.PostGIS, only: [st_intersects: 2]
  alias LanguageMap.Schemas.{Puma, Language, State}


  schema "people_summary" do
    field :age, :integer
    field :sum_weight, :integer
    field :english_id, :integer
    field :language_id, :integer
    field :citizenship_id, :integer
    field :state_id, :string
    field :geo_id, :string
  end

  defmacrop make_bounding_box(southwest_lng, southwest_lat, northeast_lng, northeast_lat) do
    quote do
      fragment("ST_MakeEnvelope(?, ?, ?, ?, 4326)",
        unquote(southwest_lng),
        unquote(southwest_lat),
        unquote(northeast_lng),
        unquote(northeast_lat))
    end
  end

  def filter_by_bounding_box(query, nil, _), do: query
  def filter_by_bounding_box(query, bounding_box, "puma") do
    from p in query,
    join: pu in Puma, on: p.geo_id == pu.geoid10,
    where: st_intersects(pu.geom, make_bounding_box(
      ^bounding_box.southwest_lng,
      ^bounding_box.southwest_lat,
      ^bounding_box.northeast_lng,
      ^bounding_box.northeast_lat))

  end
  def filter_by_bounding_box(query, bounding_box, "state") do
    from p in query,
    join: s in State, on: p.state_id == s.statefp,
    where: st_intersects(s.geom, make_bounding_box(
        ^bounding_box.southwest_lng,
        ^bounding_box.southwest_lat,
        ^bounding_box.northeast_lng,
        ^bounding_box.northeast_lat))
  end

  defmacrop divide(fieldA, fieldB) do
    quote do
      fragment("? / ?", unquote(fieldA), unquote(fieldB))
    end
  end

  defmacrop state_percentage(sum_weight, state_id) do
    quote do
      fragment(
        "sum(?) / cast((select sum(sum_weight) from people_summary where state_id = ?) as decimal(10, 2))",
        unquote(sum_weight), unquote(state_id))
    end
  end

  def group_by_state(query) do
    from p in query,
    group_by: p.state_id,
    order_by: [desc: state_percentage(p.sum_weight, p.state_id)],
    select: %{
      state_id: p.state_id,
      sum_weight: sum(p.sum_weight),
      percentage: state_percentage(p.sum_weight, p.state_id),
      relative_percentage: divide(
        state_percentage(p.sum_weight, p.state_id),
        fragment("max(?) over ()", state_percentage(p.sum_weight, p.state_id))
      ),
    }
  end

  defmacrop puma_percentage(sum_weight, geo_id) do
    quote do
      fragment(
        "sum(?) / cast((select sum(sum_weight) from people_summary where geo_id = ?) as decimal(10, 2))",
        unquote(sum_weight), unquote(geo_id))
    end
  end

  def group_by_puma(query) do
    from p in query,
    group_by: p.geo_id,
    order_by: [desc: puma_percentage(p.sum_weight, p.geo_id)],
    select: %{
      geo_id: p.geo_id,
      sum_weight: sum(p.sum_weight),
      percentage: puma_percentage(p.sum_weight, p.geo_id),
      relative_percentage: divide(
        puma_percentage(p.sum_weight, p.geo_id),
        fragment("max(?) over ()", puma_percentage(p.sum_weight, p.geo_id))
      ),
    }
  end

  def filter_by_language(query, nil), do: query
  def filter_by_language(query, language) do
    from p in query,
    join: l in Language, on: p.language_id == l.id,
    where: l.id == ^language
  end

  def filter_by_age(query, nil), do: query
  def filter_by_age(query, %{min: min_age, max: max_age}) do
    from p in query,
    where: p.age >= ^min_age,
    where: p.age <= ^max_age
  end
end

