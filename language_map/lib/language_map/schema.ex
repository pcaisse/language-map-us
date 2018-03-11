defmodule LanguageMap.LookupSchema do
  defmacro __using__(_) do
    quote do
      use Ecto.Schema
      @primary_key {:id, :id, autogenerate: false}
    end
  end
end
