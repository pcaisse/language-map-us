defmodule LanguageMap.Schemas.English do
  use LanguageMap.LookupSchema


  schema "english" do
    field :speaking_ability, :string
  end
end
