defmodule LanguageMap.State do
  use LanguageMap.LookupSchema


  @primary_key {:id, :string, []}
  schema "states" do
    field :name, :string
    field :code, :string
  end
end

