defmodule LanguageMap.Repo.Migrations.CreateLanguages do
  use Ecto.Migration

  def change do
    create table(:languages, primary_key: false) do
      add :id, :integer, primary_key: true
      add :name, :string
    end
  end
end
