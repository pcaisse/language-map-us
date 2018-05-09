#!/bin/bash

function transform_file () {
  ./usr/src/app/scripts/transform_pums_data.sh /usr/src/app/data/pums/ss16pus$1.csv /usr/src/app/data/pums/ss16pusa_simplified.csv
}

transform_file a
transform_file b
transform_file c
transform_file d
