# Language Map of the US

This language map of the United States provides insight into multilingualism and language use in the United States.

## Data

The dataset for this project is the 2012-2016 ACS 5-year Public Use Microdata Samples (PUMS).

[Download in CSV format](https://factfinder.census.gov/faces/tableservices/jsf/pages/productview.xhtml?pid=ACS_pums_csv_2012_2016&prodType=document)

[Technical documentation](https://www.census.gov/programs-surveys/acs/technical-documentation/pums/documentation.2016.html)

For more information on this data and how it was collected and processed, see the PDFs in `docs`.

## Setup

1. `cp .env.sample .env` and add secrets
1. `docker-compose build && docker-compose run`
1. `./scripts/transform_pums_data.sh data/pums/ss16ppa.csv data/pums/ss16ppa_simplified.csv`
