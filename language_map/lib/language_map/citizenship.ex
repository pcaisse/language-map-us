defmodule LanguageMap.Citizenship do
  use LanguageMap.LookupSchema
  import Ecto.Changeset


  schema "citizenship" do
    field :status, :string
  end

  @doc false
  def changeset(citizenship, attrs) do
    citizenship
    |> cast(attrs, [:status])
    |> validate_required([:status])
  end
end
