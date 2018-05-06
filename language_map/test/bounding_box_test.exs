defmodule LanguageMap.BoundingBoxTest do
  alias LanguageMap.Params.Schemas.{BoundingBox}
  import LanguageMap.Params.Parse, only: [parse_bounding_box_param: 1]
  use ExUnit.Case, async: true

  test "schema requires left, bottom, right, top" do
    assert BoundingBox.changeset(%BoundingBox{}, %{
      bottom: 39.8670,
      right: -74.9558,
      top: 40.1380,
    }).valid? == false
    assert BoundingBox.changeset(%BoundingBox{}, %{
      left: -75.2803,
      right: -74.9558,
      top: 40.1380,
    }).valid? == false
    assert BoundingBox.changeset(%BoundingBox{}, %{
      left: -75.2803,
      bottom: 39.8670,
      top: 40.1380,
    }).valid? == false
    assert BoundingBox.changeset(%BoundingBox{}, %{
      left: -75.2803,
      bottom: 39.8670,
      right: -74.9558,
    }).valid? == false
  end

  test "valid bounding box is valid" do
    assert BoundingBox.changeset(%BoundingBox{}, %{
      left: -75.2803,
      bottom: 39.8670,
      right: -74.9558,
      top: 40.1380,
    }).valid? == true
  end

  test "latitudes are validated" do
    assert BoundingBox.changeset(%BoundingBox{}, %{
      left: -175.2803,
      bottom: 39.8670,
      right: -74.9558,
      top: 40.1380,
    }).valid? == false
    assert BoundingBox.changeset(%BoundingBox{}, %{
      left: -75.2803,
      bottom: 39.8670,
      right: 174.9558,
      top: 40.1380,
    }).valid? == false
  end

  test "longitudes are validated" do
    assert BoundingBox.changeset(%BoundingBox{}, %{
      left: -75.2803,
      bottom: -239.8670,
      right: -74.9558,
      top: 40.1380,
    }).valid? == false
    assert BoundingBox.changeset(%BoundingBox{}, %{
      left: -75.2803,
      bottom: 39.8670,
      right: -74.9558,
      top: 240.1380,
    }).valid? == false
  end

  test "max and min values are valid" do
    assert BoundingBox.changeset(%BoundingBox{}, %{
      left: -90.0,
      bottom: -180.0,
      right: -89.0,
      top: -179.0,
    }).valid? == true
    assert BoundingBox.changeset(%BoundingBox{}, %{
      left: 89.0,
      bottom: 179.0,
      right: 90.0,
      top: 180.0,
    }).valid? == true
  end

  test "parsing valid and invalid bounding boxes" do
    # valid
    assert parse_bounding_box_param("-75.2803,39.8670,-74.9558,40.1380") == %{
      left: -75.2803,
      bottom: 39.8670,
      right: -74.9558,
      top: 40.1380,
    }
    # invalid
    assert parse_bounding_box_param("-175.2803,-239.8670,-74.9558,40.1380") == %{
      left: -175.2803,
      bottom: -239.8670,
      right: -74.9558,
      top: 40.1380,
    }
  end

  test "parsing malformed bounding box strings" do
    # missing value
    assert_raise Plug.BadRequestError, fn ->
      parse_bounding_box_param("-75.2803,39.8670,-74.9558,")
    end
    # extra value
    assert_raise Plug.BadRequestError, fn ->
      parse_bounding_box_param("-75.2803,39.8670,-74.9558,40.1380,40.1380")
    end
    # non-float values
    assert_raise Plug.BadRequestError, fn ->
      parse_bounding_box_param("-75,39,-74,40")
    end
  end
end
