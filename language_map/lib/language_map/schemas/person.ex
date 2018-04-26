defmodule LanguageMap.Schemas.Person do
  use Ecto.Schema
  import Ecto.Query, only: [from: 2]
  import Geo.PostGIS, only: [st_intersects: 2]
  alias LanguageMap.Schemas.{English, Puma, Language, Citizenship}


  schema "people" do
    field :age, :integer
    field :weight, :integer
    belongs_to :english, English
    belongs_to :language, Language
    belongs_to :citizenship, Citizenship
    belongs_to :puma, Puma, [
      foreign_key: :geo_id,
      references: :geoid10,
      type: :string
    ]
  end

  def filter_by_bounding_box(query, bounding_box) do
    from p in query,
    join: pu in assoc(p, :puma),
    where: st_intersects(pu.geom,
      fragment("ST_MakeEnvelope(?, ?, ?, ?, 4326)",
        ^bounding_box.left, ^bounding_box.bottom, ^bounding_box.right, ^bounding_box.top))
  end

  def group_by_state(query) do
    {
      (from p in query,
      join: pu in assoc(p, :puma),
      join: st in assoc(pu, :state),
      group_by: st.id,
      select: {st.id, sum(p.weight)}),
      ["state", "speaker_count"]
    }
  end

  @spec group_by_puma(%Ecto.Query{}) :: {%Ecto.Query{}, [String.t]}
  def group_by_puma(query) do
    {
      (from p in query,
      join: pu in assoc(p, :puma),
      join: st in assoc(pu, :state),
      group_by: st.id,
      group_by: pu.geoid10,
      select: {st.id, pu.pumace10, pu.geoid10, sum(p.weight)}),
      ["state", "puma", "geo_id", "speaker_count"]
    }
  end

  def filter_by_language(query, nil), do: query
  def filter_by_language(query, ""), do: query
  def filter_by_language(query, language) do
    from p in query,
    join: l in assoc(p, :language),
    where: l.id == ^language
  end

  def filter_by_age(query, nil), do: query
  def filter_by_age(query, [min_age, max_age]) do
    from p in query,
    where: p.age >= ^min_age,
    where: p.age <= ^max_age
  end
end
