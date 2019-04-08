#!/bin/bash
set -e

if [ ! $(git rev-parse --abbrev-ref HEAD) = "master" ]; then
  echo "Must be on master"
  exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
  echo "Branch must be clean"
  exit 1
fi

latest_version=$(git describe --abbrev=0 --tags)
read -p "Please enter the version for this release (latest tag is $latest_version): " version
read -p "Please enter the description for this release: " description

echo "Version: $version"
echo "Description: $description"

function release () {
  echo "Starting release..."
  echo "Pushing master..."
  git push origin master
  echo "Tagging master branch and pushing tag to origin..."
  git tag -a $version -m "$description"
  git push origin $version
  echo "Building Docker images..."
  docker-compose build
  echo "Tagging docker images..."
  docker tag languagemap_web:latest pcaisse/language-map-us:web-$version
  docker tag languagemap_db:latest pcaisse/language-map-us:db-$version
  echo "Pushing images..."
  docker push pcaisse/language-map-us:web-$version
  docker push pcaisse/language-map-us:db-$version
  echo "Release complete!"
}

while true; do
  read -p "Do you want to finish the release (tag, build images, and push)? " yn
  case $yn in
    [Yy]* ) release; break;;
    [Nn]* ) exit;;
    * ) echo "Please answer yes or no.";;
  esac
done
