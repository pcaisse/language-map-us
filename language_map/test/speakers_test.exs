defmodule LanguageMap.Speakers do
  alias LanguageMap.Params.Schemas.{Speakers}
  use ExUnit.Case, async: true

  @valid_bounding_box %{
    left: -75.2803,
    bottom: 39.8670,
    right: -74.9558,
    top: 40.1380,
  }
  @valid_age_range %{
    min: 10,
    max: 20,
  }

  test "requires level, language, age, bounding box" do
    assert Speakers.changeset(%Speakers{}, %{
      level: "state",
      language: "1000",
      bounding_box: @valid_bounding_box,
      age_range: @valid_age_range,
    }).valid? == true
  end

  test "invalid level" do
    assert Speakers.changeset(%Speakers{}, %{
      level: "foo",
      language: "1000",
      bounding_box: @valid_bounding_box,
      age_range: @valid_age_range,
    }).valid? == false
  end

  test "invalid language" do
    assert Speakers.changeset(%Speakers{}, %{
      level: "puma",
      language: "foo",
      bounding_box: @valid_bounding_box,
      age_range: @valid_age_range,
    }).valid? == false
  end
end
