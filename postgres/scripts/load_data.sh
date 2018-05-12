#!/bin/bash
psql -c "DELETE FROM languages;"
psql -c "COPY languages FROM '/usr/src/data/languages.csv' WITH (FORMAT csv);"
psql -c "DELETE FROM states;"
psql -c "COPY states FROM '/usr/src/data/states.csv' WITH (FORMAT csv);"
psql -c "DELETE FROM citizenship;"
psql -c "COPY citizenship FROM '/usr/src/data/citizenship.csv' WITH (FORMAT csv);"
psql -c "DELETE FROM english;"
psql -c "COPY english FROM '/usr/src/data/english.csv' WITH (FORMAT csv);"
