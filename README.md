# Language Map of the US

This language map of the United States provides insight into multilingualism and language use in the United States.

There are two different geographic areas used: states and [PUMAs (Public Use Microdata Areas)](https://www.census.gov/geo/reference/puma.html). PUMAs are contained within states, are built on census tracts and counties, and contain roughly 100,000 to 200,000 people.

## Data

The dataset for this project is multiple American Community Survey (ACS) 1-year [Public Use Microdata Sample (PUMS)](https://www.census.gov/programs-surveys/acs/microdata.html) files as well as [TIGER/Line Shapefiles](https://www.census.gov/geographies/mapping-files/time-series/geo/tiger-line-file.html) for geometries.

## Development

The web app is a static site written in TypeScript which uses [Maplibre](https://maplibre.org/) as a mapping library to display vector tiles for states and PUMAs with speaker counts by language and year baked into their metadata.

There is a data processing pipeline (read: bash scripts + [GDAL](https://gdal.org/) + [jq](https://stedolan.github.io/jq/) + [Tippecanoe](https://github.com/mapbox/tippecanoe)) to build the vector tiles with a [Dockerfile](./data/Dockerfile) which houses all of these dependencies. 

### Running locally

The quickest way to get going locally is by using existing, publicly-available vector tiles in S3 so as to not have to build them yourself (you will, however, need to create a free [MapTiler](https://www.maptiler.com/) account to get an API key for the basemap required by the app).

To run the app:

1. Get a free [MapTiler API key](https://cloud.maptiler.com/account/keys/) and export a `BASEMAP_STYLE` environment variable:
  ```
  export BASEMAP_STYLE=https://api.maptiler.com/maps/positron/style.json?key=<your_api_key_here>
  ```
1. Export a `TILES_URL`:
  ```
  export TILES_URL=https://language-map-tiles.s3.us-east-2.amazonaws.com/{z}/{x}/{y}.pbf
  ```
  or if using the dev static file server to serve tiles locally:
  ```
  export TILES_URL=http://localhost:3000/tiles/{z}/{x}/{y}.pbf
  ```
1. Build the app via `npm run build` (can also do `npm run watch` to watch for TypeScript changes)
1. Run the dev static file server via `npm run start`
1. Go to `http://localhost:3000` to view the map

### Building vector tiles

To build vector tiles locally, the general flow is to:

1. Download geometries (states and PUMAs) in the form of shapefiles
1. Download PUMS data for particular years within the decade that corresponds to those PUMAs (PUMAs are redefined every 10 years after the census)
1. Run `data/scripts/process_files`, pointing to appropriate input and output directories

If all goes well, vector tiles will be produced which can then be hosted somewhere for public consumption or can be served by a simple Express static file server (see `app/server.js`) from `app/static/tiles` for development purposes.

Here is an example of sample commands going through the whole process:

```bash
# Move into data/ directory
cd data

# Build container
docker build -t language-map/data .

# Download 2016 PUMS data
docker run -it --volume=$(pwd)/scripts:/usr/src/app --volume=/home/peter/Downloads/lm:/tmp language-map/data bash -c "./download_pums https://www2.census.gov/programs-surveys/acs/data/pums/2016/1-Year/ /tmp/pums/2016"

# Download 2010 PUMAs
docker run -it --volume=$(pwd)/scripts:/usr/src/app --volume=/home/peter/Downloads/lm:/tmp language-map/data bash -c "./download_pumas https://www2.census.gov/geo/tiger/TIGER2020/PUMA/ /tmp/shapefiles/"

# Download states
docker run -it --volume=$(pwd)/scripts:/usr/src/app --volume=/home/peter/Downloads/lm:/tmp language-map/data bash -c "./download_states https://www2.census.gov/geo/tiger/TIGER2020/STATE/ /tmp/shapefiles/"

# Process all files and build vector tiles
docker run -it --volume=$(pwd)/scripts:/usr/src/app --volume=/home/peter/Downloads/lm:/tmp language-map/data bash -c "./process_files /tmp/pums /tmp/shapefiles /tmp/tiles"

# Copy over vector tiles to static file directory for serving locally
cp -r --force ~/Downloads/lm/tiles/. app/static/tiles/
```
