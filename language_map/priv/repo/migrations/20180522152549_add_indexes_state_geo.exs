defmodule LanguageMap.Repo.Migrations.AddIndexesStateGeo do
  use Ecto.Migration

  def up do
    execute "CREATE INDEX ON people (geo_id);"
    execute "CREATE INDEX ON people (state_id);"
  end

  def down do
    execute "DROP INDEX people_state_id_idx;"
    execute "DROP INDEX people_geo_id_idx;"
  end
end
