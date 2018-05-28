defmodule LanguageMap.Schemas.Citizenship do
  use LanguageMap.LookupSchema
  import Ecto.Query, only: [from: 2]
  @behaviour LanguageMap.LookupEndpoint

  schema "citizenship" do
    field :status, :string
  end

  def list_values() do
    from c in __MODULE__,
      select: %{
        id: c.id,
        status: c.status,
      }
  end
end
