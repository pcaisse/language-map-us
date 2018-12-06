defmodule LanguageMap.Filters do
  @moduledoc """
  Common filters for querying at the PUMA or state level.
  """
  import Ecto.Query, only: [from: 2]

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
