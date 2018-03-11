defmodule LanguageMap.Repo.Migrations.CreateCitizenship do
  use Ecto.Migration

  def change do
    create table(:citizenship, primary_key: false) do
      add :id, :integer, primary_key: true
      add :status, :string
    end

  end
end
