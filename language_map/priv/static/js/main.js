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

// NOTE: Colors/percentages are from lowest to highest
const COLORS = [
  "#f2f0f7",
  "#dadaeb",
  "#bcbddc",
  "#9e9ac8",
  "#807dba",
  "#6a51a3",
  "#4a1486"
];

const PERCENTAGES = (() => {
  return COLORS.map((_, index) => 1 / 10 ** index).reverse();
})();

const DEFAULT_LAYER_STYLE = {
  color: '#ccc',
  fillColor: COLORS[0],
  weight: 1,
  fillOpacity: 0.8
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

function createTiles() {
  return L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  });
}

function urlToPath(url) {
  return url.split('?')[0];
}

const fetchJSON = (() => {
  // Keep track of pending requests to abort when a new request is made
  let pendingRequestRegistry = {};

  return (url) => {
    // NOTE: path is used for aborting pending requests to the same endpoint
    const path = urlToPath(url);
    return new Promise((resolve, reject) => {
      if (pendingRequestRegistry[path]) {
        pendingRequestRegistry[path].abort();
      }
      pendingRequestRegistry[path] = $.getJSON(url, response => {
        if (response.success) {
          resolve(response.results);
        } else {
          reject(response.message);
        }
      }).fail(reject)
        .always(() => delete pendingRequestRegistry[path]);
    });
  }
})();

function createLayers(geojsonResults, idField) {
  return geojsonResults.reduce((acc, result) => {
    acc[result[idField]] = L.geoJSON(
        result.geom,
        DEFAULT_LAYER_STYLE
    ).on("click", e => {
      return map.fitBounds(e.layer.getBounds());
    });
    return acc;
  }, {});
}

function percentageToColor(percentage) {
  for (let i = 0; i < COLORS.length; i++) {
    const currColor = COLORS[i];
    const currPercentage = PERCENTAGES[i];
    if (percentage <= currPercentage) {
      return currColor;
    }
  }
}

function formatPercentage(percentage) {
  return (percentage * 100).toFixed(COLORS.length - 1) + '%';
}

function formatTooltip(label, result) {
  return `${label}<br>
         Number of speakers: ${result.sum_weight}<br>
         Percentage: ${formatPercentage(result.percentage)}`
}

function updateLayerColor(speakerResults, isStateLevel, idField) {
  speakerResults.forEach(result => {
    const layerStyle = {
      fillColor: percentageToColor(parseFloat(result.percentage))
    };
    const layer = layers[result[idField]];
    if (layer) {
      const label = isStateLevel ?
        formatTooltip(`${result.usps} - ${result.name}`, result) :
        formatTooltip(result.name, result);
      layer.setStyle({
        ...DEFAULT_LAYER_STYLE,
        ...layerStyle
      }).bindTooltip(label,
        {
          permanent: false,
          direction: "center"
        }
      );
    }
  });
}

function updateLayers(geojsonResults, idField) {
  const prevLayers = Object.assign({}, layers);
  const currLayers = createLayers(geojsonResults, idField);
  Object.values(prevLayers).forEach(layer => {
    // Remove old layers
    if (!currLayers[layer]) {
      map.removeLayer(layer);
    }
  });
  Object.values(currLayers).forEach(layer => {
    // Add new layers
    if (!prevLayers[layer]) {
      layer.addTo(map);
    }
  });
  // Update layers
  layers = currLayers;
}

function drawMap(isStateLevel) {
  // NOTE: Query params should be the same for both async requests
  const search = window.location.search;
  const idField = isStateLevel ? "state_id" : "geo_id"
  fetchJSON('/api/geojson/' + search).then(geojsonResults => {
    updateLayers(geojsonResults, idField);
    return fetchJSON('/api/speakers/' + search);
  }).then(speakerResults => {
    updateLayerColor(speakerResults, isStateLevel, idField);
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

  window.history.pushState({
    level: levelStr,
    boundingBox: boundingBoxStr,
    language: language,
    zoomLevel: zoomLevel
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
  createTiles().addTo(map);
  refreshMap();
  map.on('moveend', _.debounce(refreshMap, 1000, {
    leading: false,
    trailing: true
  }));
});
