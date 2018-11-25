FROM mdillon/postgis:10
RUN apt-get update && apt-get --yes install wget unzip

RUN mkdir -p /usr/src/data
RUN mkdir -p /usr/src/scripts
COPY data /usr/src/app/data
COPY scripts /usr/src/app/scripts
WORKDIR /usr/src/app
