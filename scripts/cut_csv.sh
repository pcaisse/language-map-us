#!/bin/bash
#-----------------------------------------------------------------------------
# Extract fields we care about from PUMS 2012-2016 csv 
#-----------------------------------------------------------------------------
# SERIALNO,PUMA,ST,ADJINC,PWGTP,AGEP,CIT,ENG,LANX,SCHL,SEX,YEOP,LANP,NATIVITY,PINCP,POBP
input_file=$1
field_indices_to_keep='2,4,5,6,7,8,9,20,36,65,67,75,91,96,102,103'
cut -d, -f$field_indices_to_keep $input_file
