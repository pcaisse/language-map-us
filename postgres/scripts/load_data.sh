#!/bin/bash
echo "Load lookup table data"

echo "Loading languages..."
psql -U $POSTGRES_USER -d $POSTGRES_DB -c "DELETE FROM languages;"
psql -U $POSTGRES_USER -d $POSTGRES_DB -c "COPY languages FROM '/usr/src/data/languages.csv' WITH (FORMAT csv);"

echo "Loading citizenship statuses..."
psql -U $POSTGRES_USER -d $POSTGRES_DB -c "DELETE FROM citizenship;"
psql -U $POSTGRES_USER -d $POSTGRES_DB -c "COPY citizenship FROM '/usr/src/data/citizenship.csv' WITH (FORMAT csv);"

echo "Loading English-speaking abilities..."
psql -U $POSTGRES_USER -d $POSTGRES_DB -c "DELETE FROM english;"
psql -U $POSTGRES_USER -d $POSTGRES_DB -c "COPY english FROM '/usr/src/data/english.csv' WITH (FORMAT csv);"
