defmodule LanguageMap.Repo.Migrations.CreatePeopleMaterializedViews do
  use Ecto.Migration

  def up do
    execute """
      CREATE MATERIALIZED VIEW people_by_puma AS
      SELECT geo_id, sum(weight) as total
      FROM people
      GROUP BY geo_id;
    """
    execute """
      CREATE MATERIALIZED VIEW people_by_state AS
      SELECT state_id, sum(weight) as total
      FROM people
      GROUP BY state_id;
    """
  end

  def down do
    execute "DROP MATERIALIZED VIEW people_by_puma;"
    execute "DROP MATERIALIZED VIEW people_by_state;"
  end
end
