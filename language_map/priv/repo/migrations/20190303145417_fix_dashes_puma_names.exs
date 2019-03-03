defmodule LanguageMap.Repo.Migrations.FixDashesPumaNames do
  use Ecto.Migration

  def up do
    execute """
    UPDATE pumas SET name10 = replace(name10, '--', ' — ');
    """
    execute """
    REFRESH MATERIALIZED VIEW geometry_search;
    """
  end

  def down do
    execute """
    UPDATE pumas SET name10 = replace(name10, ' — ', '--');
    """
    execute """
    REFRESH MATERIALIZED VIEW geometry_search;
    """
  end
end
