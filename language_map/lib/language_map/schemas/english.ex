defmodule LanguageMap.Schemas.English do
  use LanguageMap.LookupSchema
  import Ecto.Query, only: [from: 2]
  @behaviour LanguageMap.LookupEndpoint

  schema "english" do
    field :speaking_ability, :string
  end

  def list_values() do
    from e in __MODULE__,
      select: %{
        id: e.id,
        speaking_ability: e.speaking_ability,
      }
  end
end
