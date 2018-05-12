# Language Map of the US

This language map of the United States provides insight into multilingualism and language use in the United States.

## Data

The dataset for this project is the 2012-2016 American Community Survey (ACS) 5-year Public Use Microdata Samples (PUMS).

* [Technical documentation](https://www.census.gov/programs-surveys/acs/technical-documentation/pums/documentation.2016.html)
* [Accuracy of the Data](https://www2.census.gov/programs-surveys/acs/tech_docs/pums/accuracy/2012_2016AccuracyPUMS.pdf)
* [PUMS files README](https://www2.census.gov/programs-surveys/acs/tech_docs/pums/ACS2012_2016_PUMS_README.pdf)
* [Data Dictionary](https://www2.census.gov/programs-surveys/acs/tech_docs/pums/data_dict/PUMS_Data_Dictionary_2012-2016.pdf)

## Setup

1. Create `.env` file (and add secrets)
    ```
    cp .env.sample .env
    ```
1. Set up database with data:
    ```
    make db data
    ```
1. Build, install dependencies, and run server:
    ```
    make build deps serve
    ```
