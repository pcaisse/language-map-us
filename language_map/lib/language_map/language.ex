defmodule LanguageMap.Language do
  use LanguageMap.LookupSchema
  import Ecto.Changeset


  schema "languages" do
    field :name, :string
  end

  @doc false
  def changeset(language, attrs) do
    language
    |> cast(attrs, [:name])
    |> validate_required([:name])
  end
end
