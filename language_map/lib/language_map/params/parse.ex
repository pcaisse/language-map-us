defmodule LanguageMap.Params.Parse do

  @spec parse_bounding_box_param(String.t) :: %{} | no_return
  def parse_bounding_box_param(bounding_box_param) do
    try do
      bounding_box_param
      |> String.split(",")
      |> Enum.map(&String.to_float/1)
      |> (fn ([southwest_lng, southwest_lat, northeast_lng, northeast_lat]) ->
        %{
          southwest_lng: southwest_lng,
          southwest_lat: southwest_lat,
          northeast_lng: northeast_lng,
          northeast_lat: northeast_lat,
        }
      end).()
    rescue
      ArgumentError -> raise Plug.BadRequestError, message: "Bounding box values must be floats"
      FunctionClauseError -> raise Plug.BadRequestError, message: "Missing or extra bounding box values"
    end
  end

  @spec parse_age_range_param(String.t) :: %{} | no_return
  def parse_age_range_param(age_param) do
    try do
      age_param
      |> String.split(",")
      |> Enum.map(&String.to_integer/1)
      |> (fn [min, max] -> %{min: min, max: max} end).()
    rescue
      ArgumentError -> raise Plug.BadRequestError, message: "Invalid age range parameter"
      FunctionClauseError -> raise Plug.BadRequestError, message: "Missing or extra age value"
    end
  end
end
