# Language Map of the US

This language map of the United States provides insight into multilingualism and language use in the United States.

## Data

The dataset for this project is the 2012-2016 ACS 5-year Public Use Microdata Samples (PUMS).

[Download in CSV format](https://factfinder.census.gov/faces/tableservices/jsf/pages/productview.xhtml?pid=ACS_pums_csv_2012_2016&prodType=document)

[Technical documentation](https://www.census.gov/programs-surveys/acs/technical-documentation/pums/documentation.2016.html)

For more information on this data and how it was collected and processed, see the PDFs in `docs`.

## Setup

Example is for PA

1. Configure
  ```
  cp .env.sample .env
  ```
  and add secrets
1. Fetch and extract PUMS data:
  ```
  wget https://www2.census.gov/programs-surveys/acs/data/pums/2016/5-Year/csv_ppa.zip -P /tmp && unzip /tmp/csv_ppa.zip -d data/pums/
  ```
1. Transform PUMS data:
  ```
  ./scripts/transform_pums_data.sh data/pums/ss16ppa.csv data/pums/ss16ppa_simplified.csv
  ```
1. Fetch and extract PUMA shapefile:
  ```
  wget http://www2.census.gov/geo/tiger/GENZ2016/shp/cb_2016_42_puma10_500k.zip -P /tmp && unzip /tmp/cb_2016_42_2016_42_puma10_500k.zip -d data/puma/
  ```
1. Load shapefile into database (run w/in `db` container):
  ```
  shp2pgsql -c -D -s 4269 -I /usr/src/data/puma/cb_2016_42_puma10_500k.shp pumas | psql -U postgres -d language_map
  ```
1. Use geoid10 as PK in pumas table and add unique index on state and PUMA code
  ```
  ALTER TABLE pumas DROP CONSTRAINT pumas_pkey;
  ALTER TABLE pumas DROP COLUMN gid;
  ALTER TABLE pumas ADD UNIQUE(statefp10, pumace10);
  ALTER TABLE pumas ADD PRIMARY KEY (geoid10);
  ```
1. Run migrations:
  ```
  docker-compose exec web run mix.migrate
  ```
1. Load PUMS data into database
  ```
  COPY languages FROM '/usr/src/data/languages.csv' WITH (FORMAT csv);
  COPY citizenship FROM '/usr/src/data/citizenship.csv' WITH (FORMAT csv);
  COPY english FROM '/usr/src/data/english.csv' WITH (FORMAT csv);
  COPY people (geo_id, weight, age, citizenship_id, english_id, language_id) FROM '/usr/src/data/pums/ss16ppa_simplified.csv' WITH (FORMAT csv);
  ```
1. Build and run: `docker-compose build && docker-compose run`
