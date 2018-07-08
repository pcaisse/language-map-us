#!/bin/bash

echo "Load PUMS data"

# NOTE: Contains PUMS data for all US states
file=csv_pus.zip

if [ ! -f "/usr/src/pums/$file" ]; then
  mkdir -p /usr/src/pums/
  echo "Downloading PUMS data... (NOTE: Files is 2.5 GB)"
  wget -U mozilla "https://www2.census.gov/programs-surveys/acs/data/pums/2016/5-Year/$file" -P /usr/src/pums/
fi

if [ ! -f /usr/src/pums/ss16pusa.csv ] ||
  [ ! -f /usr/src/pums/ss16pusb.csv ] ||
  [ ! -f /usr/src/pums/ss16pusc.csv ] ||
  [ ! -f /usr/src/pums/ss16pusd.csv ]; then
  echo "Extracting PUMS data files..."
  unzip "/usr/src/pums/$file" -d /usr/src/pums/
fi

mkdir -p /usr/src/pums/transformed/

function transform_file () {
  input="/usr/src/pums/ss16pus$1.csv"
  output="/usr/src/pums/transformed/ss16pus$1.csv"
  if [ ! -f $output ]; then
    ./usr/src/scripts/transform_pums_data.sh $input $output
  fi
}

declare -a suffixes=("a" "b" "c" "d")

for suffix in "${suffixes[@]}"
do
  echo "Transforming PUMS data from file..."
  transform_file $suffix

  echo "Loading PUMS data from files..."
  psql -U $POSTGRES_USER -d $POSTGRES_DB -c "COPY people (geo_id, state_id, weight, age, citizenship_id, english_id, language_id) FROM '/usr/src/pums/transformed/ss16pus${suffix}.csv' WITH (FORMAT csv);"
done
