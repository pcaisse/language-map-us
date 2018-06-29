defimpl Poison.Encoder, for: Decimal do
  @doc """
  Custom implementation of encode to not encode decimals as strings.

  Encoding decimals as strings is the default behavior so as not to loose
  precision but the loss in precision is so small that it doesn't matter and
  casting decimals to floats eases serialization.
  """
  def encode(decimal, _opts) do
    decimal |> Decimal.to_float |> :io_lib_format.fwrite_g
  end
end
