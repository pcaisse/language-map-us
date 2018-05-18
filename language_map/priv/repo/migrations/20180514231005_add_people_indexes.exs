defmodule LanguageMap.Repo.Migrations.AddPeopleIndexes do
  use Ecto.Migration

  def up do
    execute "CREATE INDEX ON people (age);"
    execute "CREATE INDEX ON people (geo_id, weight);"
  end

  def down do
    execute "DROP INDEX people_age_idx;"
    execute "DROP INDEX people_geo_id_weight_idx;"
  end
end
