defmodule LanguageMap.Repo.Migrations.CreatePumas do
  use Ecto.Migration

  def up do
    # Based on DDL in shapefile
    execute """
      CREATE TABLE "pumas" (
        gid serial,
        "statefp10" varchar(2),
        "pumace10" varchar(5),
        "affgeoid10" varchar(16),
        "geoid10" varchar(7),
        "name10" varchar(100),
        "lsad10" varchar(2),
        "aland10" float8,
        "awater10" float8
      );
    """
    execute "ALTER TABLE pumas ADD UNIQUE(statefp10, pumace10);"
    execute "ALTER TABLE pumas ADD PRIMARY KEY (geoid10);"
    execute "CREATE EXTENSION postgis;"
    execute "SELECT AddGeometryColumn('','pumas','geom','4326','MULTIPOLYGON',2);"
    execute "CREATE INDEX ON pumas USING GIST (geom);"
  end

  def down do
    execute "DROP TABLE pumas;"
    execute "DROP EXTENSION postgis;"
  end
end
