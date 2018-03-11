defmodule LanguageMap.Repo.Migrations.CreateEnglish do
  use Ecto.Migration

  def change do
    create table(:english, primary_key: false) do
      add :id, :integer, primary_key: true
      add :speaking_ability, :string
    end

  end
end
