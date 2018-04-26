defmodule LanguageMap.BoundingBox do
  @enforce_keys [:left, :bottom, :right, :top]
  defstruct [:left, :bottom, :right, :top]

  @type t(left, bottom, right, top) :: %LanguageMap.BoundingBox{left: left, bottom: bottom, right: right, top: top}
  @type t :: %LanguageMap.BoundingBox{left: float, bottom: float, right: float, top: float}
end
