const mapDefaultBounds = [  // continental US
  [24.937163301755536, -127.70907193422319],
  [49.41877065980485, -63.76864224672318]
];
const mapDefaultZoomLevel = 5;

// Parse query string params
const queryStringZoomLevel = getQueryStringParam("zoomLevel");
const queryStringBoundingBoxStr = getQueryStringParam("boundingBox");
const queryStringLanguage = getQueryStringParam("language");
const queryStringAge = getQueryStringParam("age");
const [queryStringAgeFrom, queryStringAgeTo] = queryStringAge &&
  queryStringAge.split(",") || ["", ""];
const queryStringEnglish = getQueryStringParam("english");

const map = L.map('map').fitBounds(
  boundingBoxStrToBounds(queryStringBoundingBoxStr) || mapDefaultBounds
).setZoom(
  queryStringZoomLevel || mapDefaultZoomLevel
);

// Holds all layers currently shown on the map (for both states and PUMAs as
// appropriate depending on the zoom level). The key is the geo_id (PUMAs) or
// state_id (states). These are guaranteed to never conflict (state_id is 2
// letter FIPS code -- eg. "42" -- and geo_id is 2 letter FIPS of the state
// plus the 5 letter PUMA code -- eg. "4203211").
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

const LAYER_OPACITY = 0.8;

const DEFAULT_LAYER_STYLE = {
  color: '#ccc',
  fillColor: COLORS[0],
  weight: 1,
  fillOpacity: LAYER_OPACITY
};

const TOOLTIP_PROPERTIES = {
  permanent: false,
  direction: "center"
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
  const regex = new RegExp(`[\?&]${param}=([^&=]+)`);
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

function createLayerData([geojsonResults, speakerResults], idField) {
  const geojsonData = geojsonResults.reduce((acc, geojsonResult) => {
    // Add in GeoJSON data
    acc[geojsonResult[idField]] = {
      ...acc[geojsonResult[idField]],
      ...geojsonResult
    };
    return acc;
  }, {});
  const speakerData = speakerResults.reduce((acc, speakerResult) => {
    // Add in speaker data
    acc[speakerResult[idField]] = {
      ...acc[speakerResult[idField]],
      ...speakerResult
    };
    return acc;
  }, {});
  // Recursively merge both objects to combine data
  return _.merge(geojsonData, speakerData);
}

function percentageToColor(percentage) {
  if (isNaN(percentage)) {
    return COLORS[0];
  }
  for (let i = 0; i < COLORS.length; i++) {
    const currColor = COLORS[i];
    const currPercentage = PERCENTAGES[i];
    if (percentage <= currPercentage) {
      return currColor;
    }
  }
}

function formatPercentage(percentage, precision=COLORS.length - 1) {
  return (percentage * 100).toFixed(precision) + '%';
}

function formatTooltip(result) {
  return `${result.name}<br>
         Number of speakers: ${result.sum_weight || 0}<br>
         Percentage: ${formatPercentage(result.percentage || 0)}`
}

function createLayers(layerData, idField) {
  return Object.keys(layerData).reduce((acc, key) => {
    const data = layerData[key];
    const existingLayer = layers && layers[data[idField]];
    const layerStyle = {
      fillColor: percentageToColor(parseFloat(data.percentage))
    };
    const label = formatTooltip(data);
    if (existingLayer) {
      // Re-use existing layer instead of creating a new one. This is actually
      // very important so that Leaflet is able to remove the layer when we're
      // done with it.
      acc[data[idField]] = existingLayer
        .setStyle(layerStyle)
        .unbindTooltip()
        .bindTooltip(label, TOOLTIP_PROPERTIES);
    } else {
      // Create GeoJSON object from geometry, styled/labeled appropriately based
      // on speaker data
      acc[data[idField]] = L.geoJSON(
        data.geom,
        {
          ...DEFAULT_LAYER_STYLE,
          ...layerStyle
        }
      ).on("click", e => {
        return map.fitBounds(e.layer.getBounds());
      }).bindTooltip(label, TOOLTIP_PROPERTIES);
    }
    return acc;
  }, {});
}

function updateMap(prevLayers, currLayers) {
  if (prevLayers) {
    Object.keys(prevLayers).forEach(key => {
      const layer = prevLayers[key];
      // Remove old layers
      if (!currLayers[key]) {
        map.removeLayer(layer);
      }
    });
  }
  Object.keys(currLayers).forEach(key => {
    const layer = currLayers[key];
    // Add new layers
    if (!prevLayers || !prevLayers[key]) {
      layer.addTo(map);
    }
  });
}

function drawMap() {
  // NOTE: Query params should be the same for both async requests
  const search = window.location.search;
  const idField = isStateLevel() ? "state_id" : "geo_id"
  Promise.all([
    fetchJSON('/api/geojson/' + search),
    fetchJSON('/api/speakers/' + search)
  ]).then(results => {
    // TODO: Move this out of here
    const layerData = createLayerData(results, idField);
    const currLayers = createLayers(layerData, idField);
    updateMap(layers, currLayers);
    layers = currLayers;
  }).catch(xhr => {
    if (xhr.statusText !== "abort") {
      console.error(xhr.responseJSON.errors);
    }
  });
}

function isStateLevel() {
  return map.getZoom() < 8;
}

/**
 * Refresh URL using history.pushState
 *
 * NOTE: All state should be reflected in the URL at all times so the URL is
 * shareable (source of truth when page loads).
 */
function refreshUrl() {
  const bounds = map.getBounds();
  const boundingBoxStr = bounds.toBBoxString();
  const boundingBoxFilter = {
    boundingBox: boundingBoxStr
  };

  const languageId = languageElem.val();
  const languageFilter = {
    language: languageId
  };

  const zoomLevel = map.getZoom();
  const zoomLevelFilter = {
    zoomLevel: zoomLevel
  };

  const levelStr = isStateLevel() ? "state" : "puma";
  const levelFilter = {
    level: levelStr
  };

  const ageFrom = ageFromElem.val();
  const ageTo = ageToElem.val();
  const ageSelected = ageFrom || ageTo;
  const ageStr = [ageFrom, ageTo].join(',');
  const ageFilter = ageSelected ? {
    age: ageStr
  } : {};

  const english = englishElem.val();
  const englishFilter = english !== ANY_VAL ? {
    english: english
  } : {};

  const filters = {
    ...boundingBoxFilter,
    ...languageFilter,
    ...levelFilter,
    ...zoomLevelFilter,
    ...ageFilter,
    ...englishFilter
  };

  window.history.pushState(filters,
    'Map refresh',
    `${window.location.origin}${buildQueryString(filters)}`
  );
}

function buildQueryString(filters) {
  const filtersArray = Object.keys(filters).map(key => [key, filters[key]]);
  return filtersArray.reduce((acc, [key, value], index) => {
    const separator = index === 0 ? "?" : "&";
    return acc + `${separator}${key}=${value}`;
  }, "");
}

function refreshMap() {
  refreshUrl();
  drawMap();
}

const ANY_VAL = "any";

function anyOption() {
  return `<option value="${ANY_VAL}">Any</option>`;
}

// Filter elements
const languageElem = $("#language");
const englishElem = $("#english");
const ageFromElem = $("#age_from");
const ageToElem = $("#age_to");

fetchJSON('/api/values/?filter=language').then(languages => {
  const currLanguageId = parseInt(queryStringLanguage, 10);
  const languageOptions = languages.map(({id, name}) => {
    const selected = id === currLanguageId ? "selected" : "";
    return `<option value="${id}" ${selected}>${name}</option>`;
  });
  languageElem.append(languageOptions);
  languageElem.change(refreshMap);
  return fetchJSON('/api/values/?filter=english');
}).then(englishAbilities => {
  const currEnglishId = parseInt(queryStringEnglish, 10);
  const englishAbilityOptions = englishAbilities.map(({id, speaking_ability}) => {
    const selected = id === currEnglishId ? "selected" : "";
    return `<option value="${id}" ${selected}>${speaking_ability}</option>`;
  });
  englishElem.append([anyOption(), ...englishAbilityOptions]);
  englishElem.change(refreshMap);
}).finally(() => {
  createTiles().addTo(map);
  refreshMap();
  map.on('moveend', _.debounce(refreshMap, 1000, {
    leading: false,
    trailing: true
  }));
});

function buildAgeOptions(currSelectedAge) {
  return _.range(MIN_AGE, MAX_AGE + 1).map(age => {
    const selected = age === currSelectedAge ? "selected" : "";
    return `<option value="${age}" ${selected}>${age}</option>`;
  });
}

// Add options to age dropdowns
const MIN_AGE = 0;
const MAX_AGE = 97;
const currAgeFrom = parseInt(queryStringAgeFrom, 10);
const currAgeTo = parseInt(queryStringAgeTo, 10);
const ageFromOptions = buildAgeOptions(currAgeFrom || MIN_AGE);
const ageToOptions = buildAgeOptions(currAgeTo || MAX_AGE);
ageFromElem.append(ageFromOptions);
ageFromElem.change(refreshMap);
ageToElem.append(ageToOptions);
ageToElem.change(refreshMap);

// Build legend (key)
const legendItems = _.zip(COLORS, PERCENTAGES).map(([color, percentage]) => {
  return `
    <div>
      <div class="color-box" style="background-color: ${color}; opacity: ${LAYER_OPACITY}">
      </div>
      <span><= ${formatPercentage(percentage, 4)}</span>
    </div>
  `;
});
$("#legend-items").append(legendItems);
