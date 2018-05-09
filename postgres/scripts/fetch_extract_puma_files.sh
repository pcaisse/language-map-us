#!/bin/bash

declare -a fips_codes=("01" "02" "04" "05" "06" "08" "09" "10" "11" "12" "15" "16" "17" "18" "19" "20" "21" "22" "23" "24" "25" "26" "27" "28" "29" "30" "31" "32" "33" "34" "35" "36" "37" "38" "39" "40" "41" "42" "44" "45" "46" "47" "48" "49" "50" "51" "53" "54" "55" "56" "72")

for code in "${fips_codes[@]}"
do
  wget "http://www2.census.gov/geo/tiger/GENZ2016/shp/cb_2016_${code}_puma10_500k.zip" -P /usr/src/puma/
  unzip "/usr/src/puma/cb_2016_${code}_puma10_500k.zip" -d /usr/src/puma/
done
