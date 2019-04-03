#!/bin/bash

echo "Load PUMS data"

# NOTE: Contains PUMS data for all US states
file=csv_pus.zip
file_pr=csv_ppr.zip

if [ ! -f "/usr/src/pums/$file" ]; then
  mkdir -p /usr/src/pums/
  echo "Downloading PUMS US states data... (NOTE: File is 2.3 GB)"
  wget "https://s3.us-east-2.amazonaws.com/language-map-us-public/$file" -P /usr/src/pums/
fi

if [ ! -f "/usr/src/pums/$file_pr" ]; then
  mkdir -p /usr/src/pums/
  echo "Downloading PUMS data for Puerto Rico... (this one is only 24 MB)"
  wget "https://s3.us-east-2.amazonaws.com/language-map-us-public/$file_pr" -P /usr/src/pums/
fi

if [ ! -f /usr/src/pums/ss16pusa.csv ] ||
  [ ! -f /usr/src/pums/ss16pusb.csv ] ||
  [ ! -f /usr/src/pums/ss16pusc.csv ] ||
  [ ! -f /usr/src/pums/ss16pusd.csv ]; then
  echo "Extracting PUMS data files..."
  unzip -o "/usr/src/pums/$file" -d /usr/src/pums/
fi

if [ ! -f /usr/src/pums/ss16ppr.csv ]; then
  echo "Extracting file for Puerto Rico..."
  unzip -o "/usr/src/pums/$file_pr" -d /usr/src/pums/
fi

mkdir -p /usr/src/pums/transformed/

function transform_file () {
  input="/usr/src/pums/ss16pus$1.csv"
  output="/usr/src/pums/transformed/ss16pus$1.csv"
  if [ ! -f $output ]; then
    /usr/src/scripts/transform_pums_data.sh $input $output
  fi
}

declare -a suffixes=("a" "b" "c" "d")

for suffix in "${suffixes[@]}"
do
  echo "Transforming PUMS data for US states from file $suffix..."
  transform_file $suffix

  echo "Loading PUMS data from files..."
  psql -U $POSTGRES_USER -d $POSTGRES_DB -c "COPY people (geo_id, state_id, weight, age, citizenship_id, english_id, language_id) FROM '/usr/src/pums/transformed/ss16pus${suffix}.csv' WITH (FORMAT csv);"
done

echo "Transforming PUMS data for Puerto Rico from file $file_pr..."
input_pr="/usr/src/pums/ss16ppr.csv"
output_pr="/usr/src/pums/transformed/ss16ppr.csv"
if [ ! -f $output_pr ]; then
  /usr/src/scripts/transform_pums_data.sh $input_pr $output_pr
fi

echo "Loading PUMS data for Puerto Rico from file..."
psql -U $POSTGRES_USER -d $POSTGRES_DB -c "COPY people (geo_id, state_id, weight, age, citizenship_id, english_id, language_id) FROM '/usr/src/pums/transformed/ss16ppr.csv' WITH (FORMAT csv);"
