defmodule LanguageMap.Test.Speakers do
  use ExUnit.Case, async: true

  # speakers/?level=puma&boundingBox=-75.2803,39.8670,-74.9558,40.1380&language=1210
  # speakers/?level=state&boundingBox=-75.2803,39.8670,-74.9558,40.1380
  setup do
    {:ok, pid} = Postgrex.start_link(LanguageMap.Test.Helper.opts())

    {:ok, _result} =
      Postgrex.query(
        pid,
        "DROP TABLE IF EXISTS person, english, language, puma, citizenship",
        []
      )

    {:ok, [pid: pid]}
  end

  test "insert point", context do
    pid = context[:pid]
    geo = %Geo.Point{coordinates: {30, -90}, srid: 4326}

    {:ok, _} =
      Postgrex.query(pid, "CREATE TABLE point_test (id int, geom geometry(Point, 4326))", [])

    {:ok, _} = Postgrex.query(pid, "INSERT INTO point_test VALUES ($1, $2)", [42, geo])
    {:ok, result} = Postgrex.query(pid, "SELECT * FROM point_test", [])
    assert(result.rows == [[42, geo]])
  end
end
