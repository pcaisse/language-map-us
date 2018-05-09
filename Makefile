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
	docker-compose run --rm web mix test

pums:
	docker-compose run --rm db bash /usr/src/scripts/fetch_extract_transform_pums_files.sh

puma:
	docker-compose run --rm db bash /usr/src/scripts/fetch_extract_puma_files.sh

.PHONY: default build serve compile deps check shell dbshell test pums puma
