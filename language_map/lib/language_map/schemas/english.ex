defmodule LanguageMap.Schemas.English do
  use LanguageMap.LookupSchema
  import Ecto.Query, only: [from: 2]
  @behaviour LanguageMap.LookupEndpoint

  schema "english" do
    field :speaking_ability, :string
  end

  def list_values() do
    from e in __MODULE__,
      select: {e.id, e.speaking_ability}
  end
end
