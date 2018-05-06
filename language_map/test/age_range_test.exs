defmodule LanguageMap.AgeRangeTest do
  alias LanguageMap.Params.Schemas.{AgeRange}
  import LanguageMap.Params.Parse, only: [parse_age_range_param: 1]
  use ExUnit.Case, async: true

  test "schema requires min and max" do
    assert AgeRange.changeset(%AgeRange{}, %{min: 20}).valid? == false
    assert AgeRange.changeset(%AgeRange{}, %{max: 30}).valid? == false
  end

  test "schema requires min <= max" do
    assert AgeRange.changeset(%AgeRange{}, %{min: 20, max: 20}).valid? == true
    assert AgeRange.changeset(%AgeRange{}, %{min: 20, max: 30}).valid? == true
    assert AgeRange.changeset(%AgeRange{}, %{min: 30, max: 20}).valid? == false
  end

  test "parsing valid and invalid age ranges" do
    assert parse_age_range_param("20,30") == %{min: 20, max: 30}
    assert parse_age_range_param("30,20") == %{min: 30, max: 20}
  end

  test "parsing malformed age range strings" do
    assert_raise Plug.BadRequestError, fn -> parse_age_range_param("30,") end
    assert_raise Plug.BadRequestError, fn -> parse_age_range_param("1,1,1") end
    assert_raise Plug.BadRequestError, fn -> parse_age_range_param("30") end
  end
end
