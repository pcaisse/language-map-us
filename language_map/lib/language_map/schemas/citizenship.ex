defmodule LanguageMap.Schemas.Citizenship do
  use LanguageMap.LookupSchema


  schema "citizenship" do
    field :status, :string
  end
end
