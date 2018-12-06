defmodule LanguageMap.Repo.Migrations.AddIndexesMatViews do
  use Ecto.Migration


  def up do
    execute "CREATE INDEX ON people_summary(geo_id);"
    execute "CREATE INDEX ON people_state_summary(state_id);"
  end

  def down do
    execute "DROP INDEX people_summary_geo_id_idx;"
    execute "DROP INDEX people_state_summary_state_id_idx;"
  end
end
