defmodule LanguageMap.Schemas.TotalSpeakerCounts do
  use Ecto.Schema
  import Ecto.Query, only: [from: 2]

  @primary_key {:language_id, :id, autogenerate: false}
  schema "total_speaker_counts" do
    field :name, :string
    field :sum_weight, :integer
  end

  def list_values() do
    from c in __MODULE__,
      order_by: [desc: c.sum_weight],
      select: %{
        id: c.language_id,
        name: c.name,
        sum_weight: c.sum_weight,
      }
  end
end
