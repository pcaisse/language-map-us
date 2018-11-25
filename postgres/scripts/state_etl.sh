#!/bin/bash

echo "Load states"

zip_file_path="/usr/src/puma/cb_2016_us_state_500k.zip"
if [ ! -f "$zip_file_path" ] ; then
  echo "Downloading states shapefiles..."
  wget "http://www2.census.gov/geo/tiger/GENZ2016/shp/cb_2016_us_state_500k.zip" --header 'Connection: keep-alive' --header 'User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36' -P /usr/src/puma/
fi

extracted_file_path="/usr/src/puma/cb_2016_us_state_500k.shp"
if [ ! -f "$extracted_file_path" ] ; then
  echo "Extracting shapefiles..."
  unzip "$zip_file_path" -d /usr/src/puma/
fi

echo "Loading into states table..."
psql -U $POSTGRES_USER -d $POSTGRES_DB -c "DELETE FROM states;"
shp2pgsql -a -s 4269:4326 -I "${extracted_file_path}" states | psql -U $POSTGRES_USER -d $POSTGRES_DB
