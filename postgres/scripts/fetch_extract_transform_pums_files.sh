#!/bin/bash

file=csv_pus.zip

# Fetch PUMS data
if [ ! -f "/usr/src/pums/$file" ]; then
  mkdir -p /usr/src/pums/
  wget -U mozilla "https://www2.census.gov/programs-surveys/acs/data/pums/2016/5-Year/$file" -P /usr/src/pums/
fi

# Extract
if [ ! -f /usr/src/pums/ss16pusa.csv ] ||
  [ ! -f /usr/src/pums/ss16pusb.csv ] ||
  [ ! -f /usr/src/pums/ss16pusc.csv ] ||
  [ ! -f /usr/src/pums/ss16pusd.csv ]; then
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

# Transform
transform_file a
transform_file b
transform_file c
transform_file d
