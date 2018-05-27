const mapCenter = [37.69164172115731, -94.65820312500001];
const map = L.map('map').setView(mapCenter, 5);

let layers;

function drawTiles() {
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
}

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    $.getJSON(url, response => {
      if (response.success) {
        resolve(response.results);
      } else {
        reject(response.message);
      }
    }).fail(xhr => {
      reject(xhr.responseJSON.errors);
    });
  });
}

function createLayers(results) {
  return L.layerGroup(
    results.map(result => {
      return L.geoJSON(result.geom, {
        color: 'purple',
        fillOpacity: 0
      }).on("click", e => {
        return map.fitBounds(e.layer.getBounds());
      });
    })
  );
}

function drawMap() {
  // NOTE: Query params should be the same for both async requests
  const search = window.location.search;
  fetchJSON('/api/speakers/' + search).then(speakerResults => {
    // We have speaker data. Now we need layers that reflect that data.
    return fetchJSON('/api/geojson/' + search);
  }).then(geojsonResults => {
    // TODO: Use speakerResults
    if (layers) {
      map.removeLayer(layers);
    }
    layers = createLayers(geojsonResults).addTo(map);
  }).catch(console.log);
}

function refreshMap() {
  const bounds = map.getBounds();
  const boundingBoxStr = bounds.toBBoxString();

  const isStateLevel = map.getZoom() < 8;
  const levelStr = isStateLevel ? "state" : "puma";

  history.pushState({
    level: levelStr,
    boundingBox: boundingBoxStr
  },
    'Map refresh',
    window.location.origin + '?level=' + levelStr + '&boundingBox=' + boundingBoxStr
  );

  if (layers) {
    map.removeLayer(layers);
  }
  drawMap(isStateLevel);
}

fetchJSON('/api/values/?filter=language').then(languages => {
  const languageFilter = $("#language");
  languages.forEach(({id, value}) => {
    languageFilter.append(`<option id=${id}>${value}</option`)
  });
  drawTiles();
  // TODO: Rate limit map refresh
  refreshMap();
  map.on('moveend', refreshMap);
});
