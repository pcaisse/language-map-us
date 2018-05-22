defmodule LanguageMap.Repo.Migrations.CreatePeople do
  use Ecto.Migration

  def change do
    create table(:people) do
      add :geo_id, references("pumas", [column: :geoid10, type: :string])
      add :state_id, references("states", [column: :id, type: :string])
      add :weight, :integer
      add :age, :integer
      add :citizenship_id, references(:citizenship)
      add :english_id, references(:english)
      add :language_id, references(:languages)
    end

  end
end
