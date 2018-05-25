defmodule LanguageMap.Repo.Migrations.CreateStates do
  use Ecto.Migration

  def up do
    # Based on DDL in shapefile
    execute """
    CREATE TABLE "states" (
      gid serial,
      "statefp" varchar(2),
      "statens" varchar(8),
      "affgeoid" varchar(11),
      "geoid" varchar(2),
      "stusps" varchar(2),
      "name" varchar(100),
      "lsad" varchar(2),
      "aland" float8,
      "awater" float8);
    """
    execute "ALTER TABLE states ADD PRIMARY KEY (statefp);"
    execute "SELECT AddGeometryColumn('','states','geom','4326','MULTIPOLYGON',2);"
    execute "CREATE INDEX ON states USING GIST (geom);"
  end

  def down do
    execute "DROP TABLE states;"
  end
end
