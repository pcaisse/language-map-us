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

const DEFAULT_LAYER_STYLE = {
  color: 'purple',
  fillColor: 'white',
  fillOpacity: 1
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
    acc[result[idField]] = L.geoJSON(result.geom, DEFAULT_LAYER_STYLE).on("click", e => {
      return map.fitBounds(e.layer.getBounds());
    });
    return acc;
  }, {});
}

function percentageToColor(percentage) {
  if (percentage <= 0.00000001) {
    return "#fcfbfd";
  }
  if (percentage <= 0.0000001) {
    return "#efedf5";
  }
  if (percentage <= 0.000001) {
    return "#dadaeb";
  }
  if (percentage <= 0.00001) {
    return "#bcbddc";
  }
  if (percentage <= 0.0001) {
    return "#9e9ac8";
  }
  if (percentage <= 0.001) {
    return "#807dba";
  }
  if (percentage <= 0.01) {
    return "#6a51a3";
  }
  if (percentage <= 0.1) {
    return "#54278f";
  }
  return "#3f007d";
}

function updateLayerColor(speakerResults, idField) {
  speakerResults.forEach(result => {
    const layerStyle = {
      fillColor: percentageToColor(parseFloat(result.percentage))
    };
    const layer = layers[result[idField]];
    if (layer) {
      layer.setStyle({...DEFAULT_LAYER_STYLE, ...layerStyle});
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
    updateLayerColor(speakerResults, idField);
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
