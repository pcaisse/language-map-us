# Language Map of the US

[![Build Status](https://travis-ci.org/pcaisse/language-map-us.svg?branch=master)](https://travis-ci.org/pcaisse/language-map-us)
[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=EEV9HUWFNVVV8&item_name=Support+the+Language+Map&currency_code=USD&source=url)

This language map of the United States provides insight into multilingualism and language use in the United States.

There are two different geographic areas used: states and [PUMAs (Public Use Microdata Areas)](https://www.census.gov/geo/reference/puma.html). PUMAs are contained within states, are built on census tracts and counties, and contain at least 100,000 people.

The app consists of an API written in Elixir and a simple Javascript frontend that consumes the API to visualize and filter the data.

## Data

The dataset for this project is the 2012-2016 American Community Survey (ACS) 5-year Public Use Microdata Sample (PUMS).

* [Technical documentation](https://www.census.gov/programs-surveys/acs/technical-documentation/pums/documentation.2016.html)
* [Accuracy of the Data](https://www2.census.gov/programs-surveys/acs/tech_docs/pums/accuracy/2012_2016AccuracyPUMS.pdf)
* [PUMS files README](https://www2.census.gov/programs-surveys/acs/tech_docs/pums/ACS2012_2016_PUMS_README.pdf)
* [Data Dictionary](https://www2.census.gov/programs-surveys/acs/tech_docs/pums/data_dict/PUMS_Data_Dictionary_2012-2016.pdf)

## Requirements

[Docker Compose](https://docs.docker.com/compose/install/) is the only hard requirement to run the app.

This project expects to be run on a Unix-like environment (uses a makefile) but the `make` targets are just a convenience (the `docker-compose` commands can be run directly).

## Setup

1. Create `.env` file (and add secrets)
    ```
    cp .env.sample .env
    ```
1. Build and install dependencies:
    ```
    make build deps
    ```
1. Create database and load it with data:
    ```
    make db data
    ```
    Alternatively, you can run `make db-dump` which will download a database dump and load it into your database, which should be faster.

## Run

To run the app, run `make serve`. The app should then be running on http://localhost:4000 (or whatever port you set in `.env`).

## Tests

Run tests via `make test`.

## Releases

To make a new release, simply run `./release.sh` and follow the prompts (you will need permissions to the GitHub and the Docker Hub repos).

## Support

If you'd like to make a donation to help support this project, you can do so via [PayPal](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=EEV9HUWFNVVV8&item_name=Support+the+Language+Map&currency_code=USD&source=url). Thank you!
