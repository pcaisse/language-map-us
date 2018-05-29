const mapCenter = [37.69164172115731, -94.65820312500001];
const map = L.map('map').setView(mapCenter, 5);

let layers;

const DEFAULT_LAYER_STYLE = {
  color: 'purple',
  fillOpacity: 0
};

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

function createLayers(geojsonResults, idField) {
  return geojsonResults.reduce((acc, result) => {
    acc[result[idField]] = L.geoJSON(result.geom, DEFAULT_LAYER_STYLE).on("click", e => {
      return map.fitBounds(e.layer.getBounds());
    });
    return acc;
  }, {});
}

function clearLayers() {
  if (layers) {
    Object.values(layers).forEach(layer => map.removeLayer(layer));
  }
}

function updateLayerOpacity(speakerResults, idField) {
  speakerResults.forEach(result => {
    const layerStyle = {
      fillOpacity: result.percentage
    };
    const layer = layers[result[idField]];
    if (layer) {
      layer.setStyle({...DEFAULT_LAYER_STYLE, ...layerStyle});
    }
  });
}

function drawMap(isStateLevel) {
  // NOTE: Query params should be the same for both async requests
  const search = window.location.search;
  const idField = isStateLevel ? "state_id" : "geo_id"
  fetchJSON('/api/geojson/' + search).then(geojsonResults => {
    clearLayers();
    layers = createLayers(geojsonResults, idField);
    Object.values(layers).forEach(layer => layer.addTo(map));
    return fetchJSON('/api/speakers/' + search);
  }).then(speakerResults => {
    updateLayerOpacity(speakerResults, idField);
  }).catch(console.error);
}

function refreshMap() {
  const bounds = map.getBounds();
  const boundingBoxStr = bounds.toBBoxString();
  const language = $('#language :selected').attr('id');

  const isStateLevel = map.getZoom() < 8;
  const levelStr = isStateLevel ? "state" : "puma";

  history.pushState({
    level: levelStr,
    boundingBox: boundingBoxStr,
    language: language
  },
    'Map refresh',
    `${window.location.origin}?level=${levelStr}&boundingBox=${boundingBoxStr}&language=${language}`
  );

  drawMap(isStateLevel, isStateLevel);
}

fetchJSON('/api/values/?filter=language').then(languages => {
  const languageFilter = $("#language");
  languages.forEach(({id, name}) => {
    languageFilter.append(`<option id=${id}>${name}</option`)
  });
  languageFilter.change(refreshMap);
  drawTiles();
  // TODO: Rate limit map refresh
  refreshMap();
  map.on('moveend', refreshMap);
});
