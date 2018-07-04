defmodule LanguageMap.Test.Api.SpeakersTest do
  use Plug.Test
  use ExUnit.Case, async: true

  alias LanguageMap.APIRouter
  alias LanguageMap.Repo
  alias LanguageMap.Schemas.{
    Citizenship,
    English,
    Language,
    PeopleSummary,
    Person,
    Puma,
    State,
  }

  @opts APIRouter.init([])

  setup do
    # Set state of database for all tests
    :ok = Ecto.Adapters.SQL.Sandbox.checkout(Repo)
    # Populate tables with data
    Repo.insert_all(Language, [
      %{
        id: 1,
        name: "Portuguese",
      },
      %{
        id: 2,
        name: "Turkish",
      },
    ])
    Repo.insert_all(English, [
      %{
        id: 1,
        speaking_ability: "Fluent",
      },
      %{
        id: 2,
        speaking_ability: "Proficient",
      },
    ])
    Repo.insert_all(Citizenship, [
      %{
        id: 1,
        status: "Citizen",
      },
      %{
        id: 2,
        status: "Non-citizen",
      },
    ])
    Repo.insert_all(State, [
      %{
        statefp: "42",
        name: "Pennsylvania",
      },
      %{
        statefp: "34",
        name: "New Jersey",
      },
    ])
    Repo.insert_all(Puma, [
      %{
        geoid10: "4203211",
        statefp10: "42",
        name10: "South Philly",
      },
      %{
        geoid10: "4203208",
        statefp10: "42",
        name10: "West Philly",
      },
      %{
        geoid10: "3402101",
        statefp10: "34",
        name10: "Camden",
      },
    ])
    Repo.insert_all(Person, [
      %{
        age: 10,
        weight: 10,
        english_id: 1,
        language_id: 1,
        citizenship_id: 1,
        state_id: "42",
        geo_id: "4203211",
      },
      %{
        age: 20,
        weight: 10,
        english_id: 1,
        language_id: 1,
        citizenship_id: 1,
        state_id: "42",
        geo_id: "4203211",
      },
    ])
    # Recreate materialized view
    Ecto.Adapters.SQL.query!(Repo, "DROP MATERIALIZED VIEW people_summary", []);
    Ecto.Adapters.SQL.query!(Repo, """
      CREATE MATERIALIZED VIEW people_summary AS
      SELECT state_id, geo_id, age, citizenship_id, english_id, language_id, sum(weight) as sum_weight
      FROM people
      GROUP BY state_id, geo_id, age, citizenship_id, english_id, language_id;
    """, [])
    :ok
  end

  test "get all speakers" do
    conn =
      conn(:get, "/speakers/?level=state")
      |> APIRouter.call(@opts)

    assert conn.state == :sent
    assert conn.status == 200
    assert Poison.decode!(conn.resp_body) == %{
      "success" => true,
      "results" => [%{
        "sum_weight" => 20.0,
        "state_id" => "42",
        "percentage" => 1.0,
      }]
    }
  end
end
