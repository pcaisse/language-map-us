defmodule LanguageMap.Utils do
  def conn_path_query_string(conn) do
    if conn.query_string !== "" do
      conn.request_path <> "?" <> conn.query_string
    else
      conn.request_path
    end
  end
end
