#!/bin/bash
set -e

if [ ! "$1" = "--initial" ] && [ ! "$1" = "--update" ]; then
  echo "Must supply either --initial or --update flag"
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

echo "Downloading code at release version..."
wget https://github.com/pcaisse/language-map-us/archive/$WEB_VERSION.tar.gz -O "$WEB_VERSION.tar.gz"

echo "Decompressing..."
tar -zxvf $WEB_VERSION.tar.gz

echo "Copying over .env so that docker-compose can use the environment variables..."
cp .env language-map-us-$WEB_VERSION

echo "Moving into language-map-us-* directory..."
cd language-map-us-$WEB_VERSION

if [ "$1" = "--initial" ]; then
  echo "Starting initial release..."
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
  echo "Initial release complete!"
else
  echo "Starting release..."
  echo "Getting dependencies, compiling, and running migrations..."
  docker-compose run --rm web mix do deps.get, compile, ecto.migrate
  echo "Starting server..."
  docker-compose up -d
  echo "Release complete!"
fi
