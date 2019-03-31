defmodule InfoLogger do
  require Logger
  def log(msg), do: Logger.log(:info, msg)
end
