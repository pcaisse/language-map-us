FROM elixir:1.6.2

RUN mkdir -p /usr/src/app
COPY . /usr/src/app
WORKDIR /usr/src/app

# Install Hex package manager
RUN mix local.hex --force

# Install Rebar
RUN mix local.rebar --force

RUN mix deps.get
RUN mix compile
