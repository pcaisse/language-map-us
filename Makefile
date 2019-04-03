default:
	@echo "Must call a specific subcommand"
	@exit 1

build:
	docker-compose build

serve:
	docker-compose up

compile:
	docker-compose run --rm web mix compile

deps:
	docker-compose run --rm web mix do deps.get, compile

update: deps migrate

check:
	docker-compose run --rm web mix dialyzer

shell:
	docker-compose run --rm web iex -S mix

dbshell:
	# NOTE: Requires db container to be running
	(export $$(cat .env | xargs) && docker-compose exec -e PGPASSWORD=$$POSTGRES_PASSWORD -e PGDATABASE=$$POSTGRES_DB -e PGUSER=$$POSTGRES_USER db psql)

test:
	docker-compose run -e MIX_ENV=test --rm web mix do ecto.create, ecto.migrate, test

db: recreate-db migrate-partial

recreate-db:
	docker-compose run --rm web mix do ecto.drop, ecto.create

migrate-partial:
	# Run migrations up until materialized view (need to load data before running
	# those)
	docker-compose run --rm web mix ecto.migrate --to 20180522152548

migrate:
	# Run all migrations, including creation of materialized views
	docker-compose run --rm web mix ecto.migrate

data:
	docker-compose up -d
	docker-compose exec -T db bash /usr/src/scripts/load_data.sh
	docker-compose exec -T db bash /usr/src/scripts/state_etl.sh
	docker-compose exec -T db bash /usr/src/scripts/puma_etl.sh
	docker-compose exec -T db bash /usr/src/scripts/pums_etl.sh
	docker-compose exec -T web mix ecto.migrate
	docker-compose stop

db-dump: recreate-db
	# NOTE: Requires db container to be running
	(export $$(cat .env | xargs) && docker-compose exec -e PGPASSWORD=$$POSTGRES_PASSWORD -e PGUSER=$$POSTGRES_USER db bash -c "wget https://s3.us-east-2.amazonaws.com/language-map-us-public/language_map_dump.gz && yes n | gunzip -c language_map_dump.gz | psql language_map")

.PHONY: default build serve compile deps check shell dbshell test pums puma data db recreate-db migrate migrate-partial db-dump
