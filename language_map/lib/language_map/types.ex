Postgrex.Types.define(LanguageMap.PostgresTypes, [Geo.PostGIS.Extension] ++ Ecto.Adapters.Postgres.extensions(), json: Poison)
