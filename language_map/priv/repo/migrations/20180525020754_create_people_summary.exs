defmodule LanguageMap.Repo.Migrations.CreatePeopleSummary do
  use Ecto.Migration


  def up do
    execute """
      CREATE MATERIALIZED VIEW people_summary AS
      SELECT state_id, geo_id, age, citizenship_id, english_id, language_id, sum(weight) as sum_weight
      FROM people
      GROUP BY state_id, geo_id, age, citizenship_id, english_id, language_id;
    """
    execute "CREATE INDEX ON people_summary(age);"
    execute "CREATE INDEX ON people_summary(citizenship_id);"
    execute "CREATE INDEX ON people_summary(english_id);"
    execute "CREATE INDEX ON people_summary(language_id);"
    execute "CREATE INDEX ON people_summary(state_id, sum_weight);"
    execute "CREATE INDEX ON people_summary(geo_id, sum_weight);"
  end

  def down do
    execute "DROP MATERIALIZED VIEW people_summary;"
  end
end
