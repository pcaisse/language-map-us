defmodule LanguageMap.Schemas.State do
  use Ecto.Schema
  import Ecto.Query, only: [from: 2]
  @behaviour LanguageMap.LookupEndpoint


  @primary_key {:id, :string, []}
  schema "states" do
    field :name, :string
    field :code, :string
  end

  def list_values() do
    from s in __MODULE__,
      select: {s.code, s.name}
  end
end

