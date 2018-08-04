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
	@echo "Installing Elixir dependencies"
	docker-compose run --rm web mix do deps.get, compile
	@echo "Installing Node dependencies"
	docker-compose run --rm web bash -c "cd priv/static/elm && npm install"

check:
	docker-compose run --rm web mix dialyzer

shell:
	docker-compose run --rm web iex -S mix

dbshell:
	# TODO: Fix this
	(export $$(cat .env | xargs) && docker-compose run --rm -e PGPASSWORD=$$POSTGRES_PASSWORD -e PGDATABASE=$$POSTGRES_DB -e PGUSER=$$POSTGRES_USER db psql -h db)

test:
	docker-compose run -e MIX_ENV=test --rm web mix do ecto.create, ecto.migrate, test

db: recreatedb migrate

recreatedb:
	docker-compose run --rm web mix do ecto.drop, ecto.create

migrate:
	# Run migrations up until materialized view (need to load data before running
	# those)
	docker-compose run --rm web mix ecto.migrate --to 20180522152548

data:
	docker-compose up -d
	docker-compose exec -T db bash /usr/src/scripts/load_data.sh
	docker-compose exec -T db bash /usr/src/scripts/state_etl.sh
	docker-compose exec -T db bash /usr/src/scripts/puma_etl.sh
	docker-compose exec -T db bash /usr/src/scripts/pums_etl.sh
	docker-compose exec -T web mix ecto.migrate --to 20180525020754
	docker-compose stop

.PHONY: default build serve compile deps check shell dbshell test pums puma data recreatedb migrate load-data start-db stop-db
