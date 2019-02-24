defmodule LanguageMap.Repo.Migrations.CreateSearchMatView do
  use Ecto.Migration


  def up do
    execute "CREATE EXTENSION pg_trgm;"
    execute """
    CREATE MATERIALIZED VIEW geometry_search AS
    SELECT
      CONCAT(s.name, ' (', s.stusps, ')') AS name,
      ST_AsGeoJSON(ST_AsText(ST_Envelope(s.geom))) AS bbox
    FROM states s

    UNION

    SELECT
      CONCAT(p.name10, ' - ', s.name, ' (', s.stusps, ')') as name,
      ST_AsGeoJSON(ST_AsText(ST_Envelope(p.geom))) AS bbox
    FROM pumas p
    INNER JOIN states s ON p.statefp10 = s.statefp;
    """
    execute "CREATE INDEX geometry_search_trgm_gin ON geometry_search USING GIN(name gin_trgm_ops);"
  end

  def down do
    execute "DROP MATERIALIZED VIEW geometry_search;"
    execute "DROP EXTENSION pg_trgm;"
  end
end
