defmodule LanguageMap.Filters do
  @moduledoc """
  Common filters for querying at the PUMA or state level.
  """
  import Ecto.Query, only: [from: 2]

  defmacro make_bounding_box(southwest_lng, southwest_lat, northeast_lng, northeast_lat) do
    quote do
      fragment("ST_MakeEnvelope(?, ?, ?, ?, 4326)",
        unquote(southwest_lng),
        unquote(southwest_lat),
        unquote(northeast_lng),
        unquote(northeast_lat))
    end
  end

  def filter_by_language(query, nil), do: query
  def filter_by_language(query, language) do
    from p in query,
    where: p.language_id == ^language
  end

  def filter_by_age(query, nil), do: query
  def filter_by_age(query, %{min: min_age, max: max_age}) do
    from p in query,
    where: p.age >= ^min_age,
    where: p.age <= ^max_age
  end

  def filter_by_english(query, nil), do: query
  def filter_by_english(query, english) do
    from p in query,
    where: p.english_id == ^english
  end

  def filter_by_citizenship(query, nil), do: query
  def filter_by_citizenship(query, citizenship) do
    from p in query,
    where: p.citizenship_id == ^citizenship
  end
end
