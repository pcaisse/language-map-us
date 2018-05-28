defmodule LanguageMap.Schemas.Language do
  use LanguageMap.LookupSchema
  import Ecto.Query, only: [from: 2]
  @behaviour LanguageMap.LookupEndpoint

  schema "languages" do
    field :name, :string
  end

  def list_values() do
    from l in __MODULE__,
      select: %{
        id: l.id,
        name: l.name,
      }
  end
end
