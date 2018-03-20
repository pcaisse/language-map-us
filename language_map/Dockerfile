FROM elixir:1.6.2

RUN mkdir -p /usr/src/app
COPY . /usr/src/app
WORKDIR /usr/src/app

# Install Node & watcher dependency
RUN curl -sL https://deb.nodesource.com/setup_9.x | bash -
RUN apt-get install -y nodejs inotify-tools

# Install Hex package manager
RUN mix local.hex --force

# Install Rebar
RUN mix local.rebar --force

# Install Phoenix
RUN mix archive.install --force https://github.com/phoenixframework/archives/raw/master/phx_new-1.3.1.ez

# Install dependencies
# TODO: Figure out why this has to be run manually in container
RUN mix deps.get
RUN mix compile

# Install Node dependencies
RUN npm install
RUN node node_modules/brunch/bin/brunch build
