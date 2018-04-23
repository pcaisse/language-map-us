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

.PHONY: default build serve compile deps check

