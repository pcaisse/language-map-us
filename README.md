# Language Map of the United States
[![Netlify Status](https://api.netlify.com/api/v1/badges/10213b7f-0e91-4247-ade2-48b7d3dfcf5e/deploy-status)](https://app.netlify.com/sites/sweet-dodol-bd59bc/deploys)

This language map provides insight into language diversity in the United States (50 states, District of Columbia, and Puerto Rico).

There are two different geographic levels used: states (or federal district in the case of D.C. or territory in the case of Puerto Rico) and [PUMAs (Public Use Microdata Areas)](https://www.census.gov/geo/reference/puma.html). PUMAs are subdivisions contained within the state/federal district/territory, are built on census tracts and counties, and contain about 100,000 to 200,000 people.

## Data

The dataset for this project is multiple American Community Survey (ACS) 1-year [Public Use Microdata Sample (PUMS)](https://www.census.gov/programs-surveys/acs/microdata.html) files as well as [TIGER/Line Shapefiles](https://www.census.gov/geographies/mapping-files/time-series/geo/tiger-line-file.html) for geometries.

## Development

The web app is a static site written in TypeScript which uses [MapLibre](https://maplibre.org/) to display vector tiles for states and PUMAs with speaker counts by language and year baked into their metadata.

There is a data processing pipeline (bash scripts + [GDAL](https://gdal.org/) + [jq](https://stedolan.github.io/jq/) + [Tippecanoe](https://github.com/mapbox/tippecanoe)) to build the vector tiles with a [Dockerfile](./data/Dockerfile) which houses the required dependencies. 

### Running locally

The quickest way to get going locally is by using existing, publicly-available vector tiles in S3 so as to not have to build them yourself (you will, however, need to create a free [MapTiler](https://www.maptiler.com/) account to get an API key for the basemap used by the app).

To run the app:

1. Get a free [MapTiler API key](https://cloud.maptiler.com/account/keys/) and export a `BASEMAP_STYLE` environment variable:
    ```bash
    export BASEMAP_STYLE=https://api.maptiler.com/maps/positron/style.json?key=<your_api_key_here>
    ```
    or if you'd like to use the test basemap:
    ```bash
    export BASEMAP_STYLE=http://localhost:3000/test/style.json
    ```
1. Export a `TILES_URL`:
    ```bash
    export TILES_URL=https://language-map-tiles.s3.us-east-2.amazonaws.com/{z}/{x}/{y}.pbf
    ```
    or if using the dev static file server to serve tiles locally:
    ```bash
    export TILES_URL=http://localhost:3000/tiles/{z}/{x}/{y}.pbf
    ```
    or use the test tiles (only zoom levels 0-4):
    ```bash
    export TILES_URL=http://localhost:3000/test/tiles/{z}/{x}/{y}.pbf
    ```
1. Build the app via `npm run build` (can also do `npm run watch` to watch for TypeScript changes)
1. Run the dev static file server via `npm run start`
1. Go to http://localhost:3000 to view the map

### Cypress tests

Run end-to-end Cypress tests via:
```bash
npm run cypress
```

### Building vector tiles

To build vector tiles locally, the general flow is to:

1. Download geometries (states and PUMAs) in the form of shapefiles
1. Download PUMS data for particular years within the decade that corresponds to those PUMAs (PUMAs are redefined every 10 years after the census)
1. Run `data/scripts/process_files`, pointing to appropriate input and output directories

If all goes well, vector tiles will be produced which can then be hosted somewhere for public consumption or can be served by the simple Express static file server (see `app/server.js`) from `app/static/tiles` for development purposes.

Here is an example of sample commands going through the whole process:

```bash
# Move into data/ directory
cd data

# Build container
docker build -t language-map/data .

# Download 2016 PUMS data
docker run --volume=$(pwd)/scripts:/usr/src/app --volume=$HOME/Downloads/lm:/tmp language-map/data bash -c "./download_pums https://www2.census.gov/programs-surveys/acs/data/pums/2016/1-Year/ /tmp/pums/2016"

# Download 2010 PUMAs
docker run --volume=$(pwd)/scripts:/usr/src/app --volume=$HOME/Downloads/lm:/tmp language-map/data bash -c "./download_pumas https://www2.census.gov/geo/tiger/TIGER2020/PUMA/ /tmp/shapefiles/"

# Download states
docker run --volume=$(pwd)/scripts:/usr/src/app --volume=$HOME/Downloads/lm:/tmp language-map/data bash -c "./download_states https://www2.census.gov/geo/tiger/TIGER2020/STATE/ /tmp/shapefiles/"

# Process all files and build vector tiles
docker run --volume=$(pwd)/scripts:/usr/src/app --volume=$HOME/Downloads/lm:/tmp language-map/data bash -c "./process_files /tmp/pums /tmp/shapefiles /tmp/tiles"

# Copy over vector tiles to static file directory for serving locally
cp -r --force ~/Downloads/lm/tiles/. app/static/tiles/
```

If uploading vector tiles to be served via S3, that can be done via:
```
aws s3 cp \
  --content-encoding=gzip \
  --content-type=binary/octet-stream \
  --recursive \
  <source> <target_s3_bucket>
```
