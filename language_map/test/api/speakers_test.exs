defmodule LanguageMap.Test.Api.SpeakersTest do
  use Plug.Test
  use ExUnit.Case, async: true

  alias LanguageMap.{Repo}
  alias LanguageMap.Schemas.{Language}

  setup do
    :ok = Ecto.Adapters.SQL.Sandbox.checkout(LanguageMap.Repo)
  end

  test "no data" do
    assert Language |> Repo.all |> length == 0
  end
end
