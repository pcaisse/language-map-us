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
	docker-compose run --rm db psql

test:
	MIX_ENV=test docker-compose run --rm web mix do ecto.create, ecto.migrate, test

serve-db-detached:
	docker-compose up -d db

db: serve-db-detached recreatedb migrate

recreatedb:
	docker-compose run --rm web mix do ecto.drop, ecto.create

migrate:
	# Run migrations up until materialized view (need to load data before running
	# those)
	docker-compose run --rm web mix ecto.migrate --to 20180522152548

data: serve-db-detached load-data state puma pums mat-view

load-data:
	docker-compose run --rm db bash /usr/src/scripts/load_data.sh

state:
	docker-compose run --rm db bash /usr/src/scripts/state_etl.sh

puma:
	docker-compose run --rm db bash /usr/src/scripts/puma_etl.sh

pums:
	docker-compose run --rm db bash /usr/src/scripts/pums_etl.sh

mat-view:
	docker-compose run --rm web mix ecto.migrate --to 20180525020754

.PHONY: default build serve compile deps check shell dbshell test pums puma data recreatedb migrate load-data serve-db-detached
