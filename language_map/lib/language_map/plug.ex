defmodule LanguageMap.Plug do
  import Plug.Conn

  def init(options) do
    IO.puts "starting LanguageMap.Plug..."
    options
  end

  def call(conn, _opts) do
    IO.puts "hi!"
    conn
    |> put_resp_content_type("text/plain")
    |> send_resp(200, "Hello world")
  end
end
