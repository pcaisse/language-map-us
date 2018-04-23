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
	docker-compose run --rm web bash -c "mix deps.get && mix compile"

check:
	docker-compose run --rm web mix dialyzer

dbshell:
	(export $$(cat .env | xargs) && docker-compose run --rm -e PGPASSWORD=$$POSTGRES_PASSWORD -e PGDATABASE=$$POSTGRES_DB -e PGUSER=$$POSTGRES_USER db psql -h db)

.PHONY: default build serve compile deps check

