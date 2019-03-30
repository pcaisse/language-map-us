defmodule LanguageMap.Mixfile do
  use Mix.Project

  def project do
    [
      app: :language_map,
      version: "0.1.0",
      elixir: "~> 1.4",
      build_embedded: Mix.env == :prod,
      start_permanent: Mix.env == :prod,
      deps: deps()
    ]
  end

  # Configuration for the OTP application.
  #
  # Type `mix help compile.app` for more information.
  def application do
    [
      mod: {LanguageMap, []},
      applications: applications(Mix.env)
    ]
  end

  defp applications(:dev), do: applications(:all) ++ [:remix]
  defp applications(:test), do: applications(:all)
  defp applications(:prod), do: applications(:all)
  defp applications(:all) do
    [
      :cachex,
      :cowboy,
      :ecto,
      :logger,
      :plug,
      :plug_accesslog,
      :postgrex,
    ]
  end

  defp deps do
    [
      {:cachex, "~> 3.1"},
      {:cowboy, "~> 2.5", override: true},
      {:dialyxir, "~> 0.5", only: [:dev], runtime: false},
      {:ecto, "~> 2.1"},
      {:geo_postgis, "~> 2.0"},
      {:plug, "~> 1.7"},
      {:plug_accesslog, "~> 0.14"},
      {:plug_cowboy, "~> 2.0"},
      {:poison, "~> 3.1"},
      {:postgrex, "~> 0.13.5"},
      {:remix, "~> 0.0.1", only: :dev},
    ]
  end
end
