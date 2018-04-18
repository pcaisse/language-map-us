defmodule LanguageMap.Person do
  use Ecto.Schema
  import Ecto.Query, only: [from: 2]
  import Geo.PostGIS, only: [st_intersects: 2]


  schema "people" do
    field :age, :integer
    field :weight, :integer
    belongs_to :english, LanguageMap.English
    belongs_to :language, LanguageMap.Language
    belongs_to :citizenship, LanguageMap.Citizenship
    belongs_to :puma, LanguageMap.Puma, [
      foreign_key: :geo_id,
      references: :geoid10,
      type: :string
    ]
  end

  def speaker_counts_by_puma(query, [left, bottom, right, top]) do
    from p in query,
    join: pu in assoc(p, :puma),
    where: st_intersects(pu.geom,
      fragment("ST_MakeEnvelope(?, ?, ?, ?, 4326)", ^left, ^bottom, ^right, ^top)),
    group_by: pu.geoid10,
    select: {pu.geoid10, sum(p.weight)}
  end

  def filter_by_language(query, nil), do: query
  def filter_by_language(query, ""), do: query
  def filter_by_language(query, language) do
    from p in query,
    join: l in assoc(p, :language),
    where: l.id == ^language
  end
end
