defmodule LanguageMap.State do
  use LanguageMap.LookupSchema


  schema "states" do
    field :name, :string
    field :code, :string
  end
end

