defmodule LanguageMap.Person do
  use Ecto.Schema


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
end
