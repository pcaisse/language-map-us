defmodule LanguageMap.Repo.Migrations.RemoveGeomNoData do
  use Ecto.Migration


  def up do
    # delete all geometries for which there is no data
    execute """
      DELETE FROM pumas WHERE statefp10 NOT IN (SELECT DISTINCT(state_id) FROM people_state_summary);
    """
    execute """
      DELETE FROM states WHERE statefp NOT IN (SELECT DISTINCT(state_id) FROM people_state_summary);
    """
  end

  def down do
    # no-op
  end
end
