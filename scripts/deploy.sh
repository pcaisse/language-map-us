#!/bin/bash
set -e

if [ ! "$1" = "--recreate" ] && [ ! "$1" = "--update" ]; then
  echo "Must supply either --recreate or --update flag"
  exit 1
fi

if [ ! -f ".env" ]; then
  echo "Must provide a .env file in this directory"
  exit 1
fi

if ! groups $USER | grep '\bdocker\b'
then
  echo 'This user does not belong to the docker group. May need to run: usermod -aG docker ${USER}'
  exit 1
fi

echo "Exporting all env vars from .env file..."
set -o allexport
source .env
set +o allexport

if [ "$1" = "--recreate" ]; then
  echo "Starting deployment..."
  echo "Stopping server..."
  docker-compose stop
  echo "Dropping database..."
  docker-compose run --rm web mix do ecto.drop --force, ecto.create
  echo "Starting server..."
  docker-compose up -d
  echo "Downloading database dump and loading into database..."
  docker-compose exec -e PGDATABASE=$POSTGRES_DB -e PGPASSWORD=$POSTGRES_PASSWORD -e PGUSER=$POSTGRES_USER db bash -c "wget https://s3.us-east-2.amazonaws.com/language-map-us-public/language_map_dump.gz && yes n | gunzip -c language_map_dump.gz | psql language_map"
  echo "Running migrations..."
  docker-compose run --rm web mix do ecto.migrate
  echo "Deployment complete!"
else
  echo "Starting deployment..."
  echo "Fetching dependencies, compiling, and running migrations..."
  docker-compose run --rm web mix do deps.get, compile, ecto.migrate
  echo "Starting server..."
  docker-compose up -d
  echo "Deployment complete!"
fi
