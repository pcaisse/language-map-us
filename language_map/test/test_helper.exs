:ok = Application.ensure_started(:ecto)

defmodule LanguageMap.Test.Helper do
  def opts do
    [
      hostname: "localhost",
      username: "postgres",
      database: "language_map_test",
      types: LanguageMap.PostgrexTypes
    ]
  end
end

ExUnit.start()
