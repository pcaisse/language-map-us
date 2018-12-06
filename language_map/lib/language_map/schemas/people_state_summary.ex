defmodule LanguageMap.Schemas.PeopleStateSummary do
  @moduledoc """
  Summarizes data in `people` table by aggregating weights across filters,
  rolling up to the state level.
  """
  use Ecto.Schema
  import Ecto.Query, only: [from: 2, subquery: 1]
  import Geo.PostGIS, only: [st_intersects: 2]
  alias LanguageMap.Schemas.{State}


  schema "people_state_summary" do
    field :age, :integer
    field :sum_weight, :integer
    field :english_id, :integer
    field :language_id, :integer
    field :citizenship_id, :integer
    field :state_id, :string
  end

  defmacro make_bounding_box(southwest_lng, southwest_lat, northeast_lng, northeast_lat) do
    quote do
      fragment("ST_MakeEnvelope(?, ?, ?, ?, 4326)",
        unquote(southwest_lng),
        unquote(southwest_lat),
        unquote(northeast_lng),
        unquote(northeast_lat))
    end
  end

  def filter_by_bounding_box(query, bounding_box) do
    from p in query,
    join: s in State, on: p.state_id == s.statefp,
    where: st_intersects(s.geom, make_bounding_box(
        ^bounding_box.southwest_lng,
        ^bounding_box.southwest_lat,
        ^bounding_box.northeast_lng,
        ^bounding_box.northeast_lat))
  end

  defmacrop state_percentage(sum_weight, state_id) do
    quote do
      fragment(
        "sum(?) / (select sum(sum_weight) from people_state_summary where state_id = ?)",
        unquote(sum_weight), unquote(state_id))
    end
  end

  def group_by_area(query) do
    from p in query,
    group_by: p.state_id,
    select: %{
      state_id: p.state_id,
      sum_weight: sum(p.sum_weight),
    }
  end

  def add_in_missing_areas(query, bounding_box) do
    from p in subquery(query),
    right_join: s in State, on: p.state_id == s.statefp,
    where: st_intersects(s.geom, make_bounding_box(
      ^bounding_box.southwest_lng,
      ^bounding_box.southwest_lat,
      ^bounding_box.northeast_lng,
      ^bounding_box.northeast_lat)),
    select: %{
      state_id: s.statefp,
      sum_weight: p.sum_weight,
      percentage: state_percentage(p.sum_weight, s.statefp),
    },
    group_by: [s.statefp, p.sum_weight]
  end
end

