defmodule LanguageMap.Repo.Migrations.CreatePeopleStateSummary do
  use Ecto.Migration


  def up do
    execute """
      CREATE MATERIALIZED VIEW people_state_summary AS
      SELECT state_id, age, citizenship_id, english_id, language_id, sum(weight) as sum_weight
      FROM people
      GROUP BY state_id, age, citizenship_id, english_id, language_id;
    """
    execute "CREATE INDEX ON people_state_summary(age);"
    execute "CREATE INDEX ON people_state_summary(citizenship_id);"
    execute "CREATE INDEX ON people_state_summary(english_id);"
    execute "CREATE INDEX ON people_state_summary(language_id);"
    execute "CREATE INDEX ON people_state_summary(state_id, sum_weight);"
  end

  def down do
    execute "DROP MATERIALIZED VIEW people_state_summary;"
  end
end
