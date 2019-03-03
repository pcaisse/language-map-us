defmodule LanguageMap.Schemas.GeometrySearch do
  @moduledoc """
  Name and bounding box of states and PUMAs to power geometry search.
  """
  use Ecto.Schema
  import Ecto.Query, only: [from: 2]

  schema "geometry_search" do
    field :name, :string
    field :bbox, :string
  end

  def search(text, limit) do
    from gs in __MODULE__,
      where: ilike(gs.name, ^"%#{text}%"),
      order_by: [desc: ilike(gs.name, ^"#{text}%")],
      limit: ^limit,
      select: %{
        name: gs.name,
        bbox: gs.bbox,
      }
  end
end
