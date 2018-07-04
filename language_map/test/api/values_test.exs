defmodule LanguageMap.Test.Api.ValuesTest do
  use Plug.Test
  use ExUnit.Case, async: true

  alias LanguageMap.APIRouter
  alias LanguageMap.{Repo}
  alias LanguageMap.Schemas.{Language}

  @opts APIRouter.init([])

  setup do
    # Set state of database for all tests
    :ok = Ecto.Adapters.SQL.Sandbox.checkout(Repo)
    Repo.insert!(%Language{id: 1, name: "Portuguese"})
    :ok
  end

  test "get languages" do
    conn =
      conn(:get, "/values/?filter=language")
      |> APIRouter.call(@opts)

    assert conn.state == :sent
    assert conn.status == 200
    assert Poison.decode!(conn.resp_body) == %{
      "success" => true,
      "results" => [%{
        "id" => 1,
        "name" => "Portuguese",
      }]
    }
  end
end
