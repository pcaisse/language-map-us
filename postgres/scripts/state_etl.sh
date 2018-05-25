#!/bin/bash

# Download states files
zip_file_path="/usr/src/puma/cb_2016_us_state_500k.zip"
if [ ! -f "$zip_file_path" ] ; then
  wget "http://www2.census.gov/geo/tiger/GENZ2016/shp/cb_2016_us_state_500k.zip" -P /usr/src/puma/
fi
# Extract
extracted_file_path="/usr/src/puma/cb_2016_us_state_500k.shp"
if [ ! -f "$extracted_file_path" ] ; then
  unzip "$zip_file_path" -d /usr/src/puma/
fi
# Load into `states` table
psql -c "DELETE FROM states;"
shp2pgsql -a -s 4269:4326 -I "${extracted_file_path}" states | psql
