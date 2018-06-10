const mapDefaultBounds = [  // continental US
  [24.937163301755536, -127.70907193422319],
  [49.41877065980485, -63.76864224672318]
];
const mapDefaultZoomLevel = 5;

// Parse query string params
const queryStringZoomLevel = getQueryStringParam("zoomLevel");
const queryStringBoundingBoxStr = getQueryStringParam("boundingBox");
const queryStringLanguage = getQueryStringParam("language");

const map = L.map('map').fitBounds(
  boundingBoxStrToBounds(queryStringBoundingBoxStr) || mapDefaultBounds
).setZoom(
  queryStringZoomLevel || mapDefaultZoomLevel
);

let layers;
let pendingRequestRegistry = {};

const DEFAULT_LAYER_STYLE = {
  color: 'purple',
  fillOpacity: 0
};

function boundingBoxStrToBounds(boundingBoxStr) {
  if (!boundingBoxStr) {
    return null;
  }
  const mapBounds = boundingBoxStr.split(",");
  return [
    [mapBounds[1], mapBounds[0]],
    [mapBounds[3], mapBounds[2]],
  ];
}

function getQueryStringParam(param) {
  const regex = new RegExp(`${param}=([^&=]+)`);
  const results = regex.exec(window.location.search);
  return results && results[1];
}

function drawTiles() {
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
}

function urlToPath(url) {
  return url.split('0')[0];
}

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    if (pendingRequestRegistry[urlToPath(url)]) {
      pendingRequestRegistry[urlToPath(url)].abort();
    }
    pendingRequestRegistry[urlToPath(url)] = $.getJSON(url, response => {
      if (response.success) {
        resolve(response.results);
      } else {
        reject(response.message);
      }
    }).fail(xhr => reject(xhr)
    ).always(() => delete pendingRequestRegistry[urlToPath(url)]);
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
      fillOpacity: result.relative_percentage
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
  }).catch(xhr => {
    if (xhr.statusText !== "abort") {
      console.error(xhr.responseJSON.errors);
    }
  });
}

function refreshMap() {
  const bounds = map.getBounds();
  const boundingBoxStr = bounds.toBBoxString();
  const language = $('#language :selected').attr('id');

  const zoomLevel = map.getZoom();
  const isStateLevel = zoomLevel < 8;
  const levelStr = isStateLevel ? "state" : "puma";

  history.pushState({
    level: levelStr,
    boundingBox: boundingBoxStr,
    language: language
  },
    'Map refresh',
    `${window.location.origin}?level=${levelStr}&boundingBox=${boundingBoxStr}&language=${language}&zoomLevel=${zoomLevel}`
  );

  drawMap(isStateLevel);
}

fetchJSON('/api/values/?filter=language').then(languages => {
  const languageFilter = $("#language");
  const languageOptions = languages.map(({id, name}) => {
    const selected = id === parseInt(queryStringLanguage, 10) ? "selected" : "";
    return `<option id="${id}" ${selected}>${name}</option>`;
  });
  languageFilter.append(languageOptions);
  languageFilter.change(refreshMap);
}).finally(() => {
  drawTiles();
  // TODO: Rate limit map refresh
  refreshMap();
  map.on('moveend', _.debounce(refreshMap, 1000, {
    leading: false,
    trailing: true
  }));
});
