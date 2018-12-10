defmodule LanguageMap.Test.Api.ValuesTest do
  use Plug.Test
  use ExUnit.Case, async: true

  alias LanguageMap.APIRouter
  alias LanguageMap.{Repo}
  alias LanguageMap.Schemas.{Language, English, Citizenship}

  @opts APIRouter.init([])

  setup do
    # Set state of database for all tests
    :ok = Ecto.Adapters.SQL.Sandbox.checkout(Repo)
    Repo.insert!(%Language{id: 1, name: "Portuguese"})
    Repo.insert!(%English{id: 1, speaking_ability: "Fluent"})
    Repo.insert!(%Citizenship{id: 1, status: "Citizen"})
    :ok
  end

  test "get languages" do
    conn =
      conn(:get, "/values/")
      |> APIRouter.call(@opts)

    assert conn.state == :sent
    assert conn.status == 200
    assert Poison.decode!(conn.resp_body) == %{
      "success" => true,
      "results" => %{
        "languages" => [%{
          "id" => 1,
          "name" => "Portuguese",
        }],
        "englishSpeakingAbilities" => [%{
          "id" => 1,
          "speaking_ability" => "Fluent",
        }],
        "citizenshipStatuses" => [%{
          "id" => 1,
          "status" => "Citizen",
        }],
      }
    }
  end
end
