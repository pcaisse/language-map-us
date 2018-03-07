#!/bin/bash
#------------------------------------------------------------------------------
# Transform data from PUMS 2012-2016 CSV so it can be imported into database.
#------------------------------------------------------------------------------
set -e

if [ $# -le 1 ]
then
  echo "Script must be passed two arguments (input file CSV and output file CSV)"
  exit 1
fi

input_file=$1
output_file=$2

# PUMA,ST,PWGTP,AGEP,CIT,ENG,LANP
field_indices_to_keep='4,5,7,8,9,20,91'

# Extract relevant fields
cut -d, -f$field_indices_to_keep $input_file | \
  # Remove leading zeroes
  perl -pe 's/0*(\d+)/$1/g' > $output_file
