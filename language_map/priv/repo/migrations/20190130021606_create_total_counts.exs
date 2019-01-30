defmodule LanguageMap.Repo.Migrations.CreateTotalCounts do
  use Ecto.Migration

  def up do
    execute """
      CREATE MATERIALIZED VIEW total_speaker_counts AS
        SELECT language_id, name, sum(weight::integer) AS sum_weight
        FROM people p
        INNER JOIN languages l ON p.language_id = l.id
        GROUP BY language_id, name;
    """
    execute "CREATE INDEX ON total_speaker_counts(sum_weight);"
  end

  def down do
    execute "DROP MATERIALIZED VIEW total_speaker_counts;"
  end

end
