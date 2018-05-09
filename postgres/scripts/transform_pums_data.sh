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
  # Combine first two fields (PUMA & ST) into one geoid to use as FK to PUMA
  # because PUMA codes do not uniquely identify a PUMA (also need state)
  perl -pe 's/^([^,]+),([^,]+)/$2$1/g' | \
    # Remove header
    tail -n +2 > $output_file
