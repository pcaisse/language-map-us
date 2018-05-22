defmodule LanguageMap.Repo.Migrations.AddStateIdToPeople do
  use Ecto.Migration

  def up do
    execute "CREATE INDEX ON people (state_id, weight);"
  end

  def down do
    execute "DROP INDEX people_state_id_weight_idx;"
  end
end
