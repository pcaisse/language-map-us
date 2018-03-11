defmodule LanguageMap.English do
  use LanguageMap.LookupSchema
  import Ecto.Changeset


  schema "english" do
    field :speaking_ability, :string
  end

  @doc false
  def changeset(english, attrs) do
    english
    |> cast(attrs, [:speaking_ability])
    |> validate_required([:speaking_ability])
  end
end
