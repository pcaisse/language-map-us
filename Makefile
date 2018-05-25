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
	docker-compose run --rm web mix test

db: recreatedb migrate

recreatedb:
	docker-compose run --rm web mix do ecto.drop, ecto.create

migrate:
	docker-compose run --rm web mix ecto.migrate

data: load-data state puma pums

load-data:
	docker-compose run --rm db bash /usr/src/scripts/load_data.sh

state:
	docker-compose run --rm db bash /usr/src/scripts/state_etl.sh

puma:
	docker-compose run --rm db bash /usr/src/scripts/puma_etl.sh

pums:
	docker-compose run --rm db bash /usr/src/scripts/pums_etl.sh

.PHONY: default build serve compile deps check shell dbshell test pums puma data recreatedb migrate load-data
