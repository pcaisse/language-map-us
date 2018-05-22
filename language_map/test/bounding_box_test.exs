defmodule LanguageMap.BoundingBoxTest do
  alias LanguageMap.Params.Schemas.{BoundingBox}
  import LanguageMap.Params.Parse, only: [parse_bounding_box_param: 1]
  use ExUnit.Case, async: true

  test "schema requires southwest_lng, southwest_lat, northeast_lng, northeast_lat" do
    assert BoundingBox.changeset(%BoundingBox{}, %{
      southwest_lat: 39.8670,
      northeast_lng: -74.9558,
      northeast_lat: 40.1380,
    }).valid? == false
    assert BoundingBox.changeset(%BoundingBox{}, %{
      southwest_lng: -75.2803,
      northeast_lng: -74.9558,
      northeast_lat: 40.1380,
    }).valid? == false
    assert BoundingBox.changeset(%BoundingBox{}, %{
      southwest_lng: -75.2803,
      southwest_lat: 39.8670,
      northeast_lat: 40.1380,
    }).valid? == false
    assert BoundingBox.changeset(%BoundingBox{}, %{
      southwest_lng: -75.2803,
      southwest_lat: 39.8670,
      northeast_lng: -74.9558,
    }).valid? == false
  end

  test "valid bounding box is valid" do
    assert BoundingBox.changeset(%BoundingBox{}, %{
      southwest_lng: -75.2803,
      southwest_lat: 39.8670,
      northeast_lng: -74.9558,
      northeast_lat: 40.1380,
    }).valid? == true
  end

  test "longitudes are validated" do
    assert BoundingBox.changeset(%BoundingBox{}, %{
      southwest_lng: -275.2803,
      southwest_lat: 39.8670,
      northeast_lng: -74.9558,
      northeast_lat: 40.1380,
    }).valid? == false
    assert BoundingBox.changeset(%BoundingBox{}, %{
      southwest_lng: -75.2803,
      southwest_lat: 39.8670,
      northeast_lng: 274.9558,
      northeast_lat: 40.1380,
    }).valid? == false
  end

  test "latitudes are validated" do
    assert BoundingBox.changeset(%BoundingBox{}, %{
      southwest_lng: -75.2803,
      southwest_lat: -139.8670,
      northeast_lng: -74.9558,
      northeast_lat: 40.1380,
    }).valid? == false
    assert BoundingBox.changeset(%BoundingBox{}, %{
      southwest_lng: -75.2803,
      southwest_lat: 39.8670,
      northeast_lng: -74.9558,
      northeast_lat: 140.1380,
    }).valid? == false
  end

  test "max and min values are valid" do
    assert BoundingBox.changeset(%BoundingBox{}, %{
      southwest_lng: -180.0,
      southwest_lat: -90.0,
      northeast_lng: -179.0,
      northeast_lat: -89.0,
    }).valid? == true
    assert BoundingBox.changeset(%BoundingBox{}, %{
      southwest_lng: 179.0,
      southwest_lat: 89.0,
      northeast_lng: 180.0,
      northeast_lat: 90.0,
    }).valid? == true
  end

  test "parsing valid and invalid bounding boxes doesn't throw" do
    # valid
    assert parse_bounding_box_param("-75.2803,39.8670,-74.9558,40.1380") == %{
      southwest_lng: -75.2803,
      southwest_lat: 39.8670,
      northeast_lng: -74.9558,
      northeast_lat: 40.1380,
    }
    # invalid
    assert parse_bounding_box_param("-275.2803,-139.8670,-74.9558,40.1380") == %{
      southwest_lng: -275.2803,
      southwest_lat: -139.8670,
      northeast_lng: -74.9558,
      northeast_lat: 40.1380,
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
