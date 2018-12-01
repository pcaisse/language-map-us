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

check:
	docker-compose run --rm web mix dialyzer

shell:
	docker-compose run --rm web iex -S mix

dbshell:
	(export $$(cat .env | xargs) && docker-compose run --rm -e PGPASSWORD=$$POSTGRES_PASSWORD -e PGDATABASE=$$POSTGRES_DB -e PGUSER=$$POSTGRES_USER db psql -h db)

test:
	docker-compose run -e MIX_ENV=test --rm web mix do ecto.create, ecto.migrate, test

db: recreatedb migrate-partial

recreatedb:
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

.PHONY: default build serve compile deps check shell dbshell test pums puma data recreatedb migrate load-data start-db stop-db
