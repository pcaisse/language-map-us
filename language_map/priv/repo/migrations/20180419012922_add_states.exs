defmodule LanguageMap.Repo.Migrations.AddStates do
  use Ecto.Migration

  def change do
    create table(:states, primary_key: false) do
      add :id, :integer, primary_key: true
      add :name, :string
      add :code, :string
    end
  end
end
