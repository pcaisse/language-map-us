FROM osgeo/gdal:ubuntu-full-3.6.0

# Install Node and deps for building Tippecanoe
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
  apt-get update && \
  apt-get install -y git build-essential libsqlite3-dev zlib1g-dev nodejs

# Build Tippecanoe from source
RUN curl -L https://github.com/mapbox/tippecanoe/archive/refs/tags/1.36.0.tar.gz | tar -xz
WORKDIR tippecanoe-1.36.0
RUN make -j
RUN make install

# Copy over data processing files
RUN mkdir -p /usr/src/app
COPY . /usr/src/app
WORKDIR /usr/src/app
