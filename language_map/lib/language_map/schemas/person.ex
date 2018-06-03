defmodule LanguageMap.Schemas.Person do
  use Ecto.Schema
  alias LanguageMap.Schemas.{English, Puma, Language, Citizenship, State}


  schema "people" do
    field :age, :integer
    field :weight, :integer
    belongs_to :english, English
    belongs_to :language, Language
    belongs_to :citizenship, Citizenship
    belongs_to :state, State, [
      foreign_key: :state_id,
      references: :statefp,
      type: :string
    ]
    belongs_to :puma, Puma, [
      foreign_key: :geo_id,
      references: :geoid10,
      type: :string
    ]
  end
end
