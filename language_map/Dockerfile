FROM elixir:1.6.2

RUN mkdir -p /usr/src/app
COPY . /usr/src/app
WORKDIR /usr/src/app

# Install Hex package manager
RUN mix local.hex --force

# Install Rebar
RUN mix local.rebar --force

# Install Node
RUN apt-get install -yq curl
RUN curl -sL https://deb.nodesource.com/setup_8.x | bash -
RUN apt-get install -yq nodejs build-essential

# Upgrade to latest version of npm
RUN npm install -g npm
