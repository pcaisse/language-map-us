defmodule LanguageMap.Schemas.Person do
  use Ecto.Schema
  import Ecto.Query, only: [from: 2]
  import Geo.PostGIS, only: [st_intersects: 2]
  alias LanguageMap.Schemas.{English, Puma, Language, Citizenship, State}


  schema "people" do
    field :age, :integer
    field :weight, :integer
    belongs_to :english, English
    belongs_to :language, Language
    belongs_to :citizenship, Citizenship
    belongs_to :state, State, [
      foreign_key: :state_id,
      references: :id,
      type: :string
    ]
    belongs_to :puma, Puma, [
      foreign_key: :geo_id,
      references: :geoid10,
      type: :string
    ]
  end

  def filter_by_bounding_box(query, nil), do: query
  def filter_by_bounding_box(query, bounding_box) do
    from p in query,
    join: pu in assoc(p, :puma),
    where: st_intersects(pu.geom,
      fragment("ST_MakeEnvelope(?, ?, ?, ?, 4326)",
        ^bounding_box.southwest_lng,
        ^bounding_box.southwest_lat,
        ^bounding_box.northeast_lng,
        ^bounding_box.northeast_lat))
  end

  # TODO: States should count entirely, not partially based on the PUMAs that
  # intersect with the bounding box.
  @spec group_by_state(%Ecto.Query{}) :: {%Ecto.Query{}, [String.t]}
  def group_by_state(query) do
    {
      (from p in query,
      group_by: p.state_id,
      select: {
        p.state_id,
        sum(p.weight),
        fragment("sum(?) / cast((select total from people_by_state where state_id = ?) as decimal(10, 2))",
          p.weight, p.state_id)
      }),
      ["state", "speaker_count", "percentage"]
    }
  end

  @spec group_by_puma(%Ecto.Query{}) :: {%Ecto.Query{}, [String.t]}
  def group_by_puma(query) do
    {
      (from p in query,
      join: pu in assoc(p, :puma),
      group_by: pu.geoid10,
      select: {
        pu.statefp10,
        pu.pumace10,
        pu.geoid10,
        sum(p.weight),
        fragment("sum(?) / cast((select total from people_by_puma where geo_id = ?) as decimal(10, 2))",
          p.weight, pu.geoid10)
      }),
      ["state", "puma", "geo_id", "speaker_count", "percentage"]
    }
  end

  def filter_by_language(query, nil), do: query
  def filter_by_language(query, language) do
    from p in query,
    join: l in assoc(p, :language),
    where: l.id == ^language
  end

  def filter_by_age(query, nil), do: query
  def filter_by_age(query, %{min: min_age, max: max_age}) do
    from p in query,
    where: p.age >= ^min_age,
    where: p.age <= ^max_age
  end
end
