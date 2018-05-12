defmodule LanguageMap.Repo.Migrations.AddPumasStatesFk do
  use Ecto.Migration

  def up do
    execute """
      ALTER TABLE pumas ADD CONSTRAINT pumas_states_id_fkey FOREIGN KEY (statefp10) REFERENCES states(id);
    """
  end

  def down do
    execute "ALTER TABLE pumas DROP CONSTRAINT pumas_states_id_fkey;"
  end

  def change do

  end
end
