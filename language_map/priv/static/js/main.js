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
const queryStringCitizenship = getQueryStringParam("citizenship");

const map = L.map('map', {
  zoomControl: false,
  maxBounds: [
    [-90, -180],
    [90, 180]
  ],
  minZoom: 3
}).fitBounds(
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
// Used for caching geometries
let geometriesCache = JSON.parse(localStorage.getItem('geojsonCache')) || {};

// NOTE: Colors/percentages are from lowest to highest
const COLORS = [
  "#edf8fb",
  "#bfd3e6",
  "#9ebcda",
  "#8c96c6",
  "#8c6bb1",
  "#88419d",
  "#6e016b"
];
const MAX_PERCENTAGES = (() => {
  return COLORS.map((_, index) => 1 / 10 ** index).reverse();
})();
const MIN_PERCENTAGES = [null, ..._.dropRight(MAX_PERCENTAGES)];

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

const spinner = $('.loader');

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

function createLayerData({geojson, speakers}, idField) {
  const geojsonData = geojson.reduce((acc, geojsonResult) => {
    // Add in GeoJSON data
    acc[geojsonResult[idField]] = {
      ...acc[geojsonResult[idField]],
      ...geojsonResult
    };
    return acc;
  }, {});
  const speakerData = speakers.reduce((acc, speakerResult) => {
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
    const currPercentage = MAX_PERCENTAGES[i];
    if (percentage <= currPercentage) {
      return currColor;
    }
  }
}

function formatPercentage(percentage, precision=COLORS.length - 1) {
  return +((percentage * 100).toFixed(precision)) + '%';
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
      fillColor: percentageToColor(data.percentage)
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
      ).bindTooltip(label, TOOLTIP_PROPERTIES);
    }
    return acc;
  }, {});
}

function drawMap(prevLayers, currLayers) {
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

const idsFromResults = results => {
  return results.map(result => getId(result));
};

const getId = obj =>
  obj.hasOwnProperty('geo_id') ?
    obj.geo_id :
    obj.state_id

function fetchResults(callback) {
  spinner.show();
  fetchJSON('/api/speakers/' + window.location.search)
    .then(speakerResults => {
      const results = {speakers: speakerResults};
      // Only fetch geometries that aren't cached
      const areasToShow = idsFromResults(speakerResults);
      const cachedGeometryIds = Object.keys(geometriesCache);
      const geometriesToFetch = _.difference(areasToShow, cachedGeometryIds);
      const geometriesToLoadFromCache = _.difference(areasToShow, geometriesToFetch);
      const cachedGeometries = Object.values(_.pick(geometriesCache, areasToShow));
      if (geometriesToFetch.length) {
        // Fetch un-cached geometries
        return fetchJSON('/api/geojson/?level=' + getQueryStringParam("level") + '&ids=' + geometriesToFetch.join(','))
          .then(geojsonResults => Object.assign(results, {
             geojson: geojsonResults.concat(cachedGeometries)
          }));
      } else {
        // All geometries that need to be shown are cached
        return new Promise((resolve, _) => resolve(Object.assign(results, {
          geojson: cachedGeometries
        })));
      }
    })
    .then(results => {
      callback(results);
    }).catch(err => {
      if (err.status === 400) {
        console.error("Bad request", err.responseJSON.errors);
      } else {
        console.error(err);
      }
    }).finally(() => spinner.hide());
}

function isStateLevel() {
  return map.getZoom() < 8;
}

function getSimplifiedMapBounds() {
  const bounds = map.getBounds();
  const boundingBoxStr = bounds.toBBoxString();
  const values = boundingBoxStr.split(',').map(parseFloat);
  return values.map(f => f.toFixed(2)).join(',');
}

/**
 * Refresh URL using history.pushState
 *
 * NOTE: All state should be reflected in the URL at all times so the URL is
 * shareable (source of truth when page loads).
 */
function refreshUrl(stateLevel) {
  const boundingBoxFilter = {
    boundingBox: getSimplifiedMapBounds()
  };

  const languageId = languageElem.val();
  const languageFilter = {
    language: languageId
  };

  const zoomLevel = map.getZoom();
  const zoomLevelFilter = {
    zoomLevel: zoomLevel
  };

  const levelStr = stateLevel ? "state" : "puma";
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

  const citizenship = citizenshipElem.val();
  const citizenshipFilter = citizenship !== ANY_VAL ? {
    citizenship: citizenship
  } : {};

  const filters = {
    ...boundingBoxFilter,
    ...languageFilter,
    ...levelFilter,
    ...zoomLevelFilter,
    ...ageFilter,
    ...englishFilter,
    ...citizenshipFilter
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
  const stateLevel = isStateLevel();
  refreshUrl(stateLevel);
  fetchResults(results => {
    // Get new map data and redraw map
    const idField = stateLevel ? "state_id" : "geo_id"
    const layerData = createLayerData(results, idField);
    const currLayers = createLayers(layerData, idField);
    drawMap(layers, currLayers);
    layers = currLayers;
    const geojsonResultsObj = results.geojson.reduce((acc, value) => {
      acc[getId(value)] = value;
      return acc;
    }, {});
    geometriesCache = Object.assign(geometriesCache, geojsonResultsObj);
    try {
      localStorage.setItem('geojsonCache', JSON.stringify(geometriesCache));
    } catch (err) {
      // localstorage quota exceeded, so no-op
    }
  });
}

const ANY_VAL = "any";

function anyOption() {
  return `<option value="${ANY_VAL}">Any</option>`;
}

function options(selectedValue, id, value) {
  const selected = id === selectedValue ? "selected" : "";
  return `<option value="${id}" ${selected}>${value}</option>`;
}

// Filter elements
const languageElem = $("#language");
const englishElem = $("#english");
const ageFromElem = $("#age_from");
const ageToElem = $("#age_to");
const citizenshipElem = $("#citizenship");

fetchJSON('/api/values/').then(({languages, englishSpeakingAbilities, citizenshipStatuses}) => {
  // Language options
  const currLanguageId = parseInt(queryStringLanguage, 10);
  const languageOptions = languages.map(({id, name}) => {
    return options(currLanguageId, id, name);
  });
  languageElem.append(languageOptions);
  languageElem.change(refreshMap);
  // English speaking ability options
  const currEnglishId = parseInt(queryStringEnglish, 10);
  const englishAbilityOptions = englishSpeakingAbilities.map(({id, speaking_ability}) => {
    return options(currEnglishId, id, speaking_ability);
  });
  englishElem.append([anyOption(), ...englishAbilityOptions]);
  englishElem.change(refreshMap);
  // Citizenship status options
  const currCitizenshipId = parseInt(queryStringCitizenship, 10);
  const citizenshipOptions = citizenshipStatuses.map(({id, status}) => {
    return options(currCitizenshipId, id, status);
  });
  citizenshipElem.append([anyOption(), ...citizenshipOptions]);
  citizenshipElem.change(refreshMap);
  // Create map
  createTiles().addTo(map);
  refreshMap();
  map.on('moveend', _.debounce(refreshMap, 1000, {
    leading: false,
    trailing: true
  }));
});

function buildAgeOptions(currSelectedAge) {
  return _.range(MIN_AGE, MAX_AGE + 1).map(age => {
    return options(currSelectedAge, age, age);
  });
}

// Add options to age dropdowns
const MIN_AGE = 0;
const MAX_AGE = 97;
const currAgeFrom = parseInt(queryStringAgeFrom, 10);
const currAgeTo = parseInt(queryStringAgeTo, 10);
const ageFromOptions = buildAgeOptions(currAgeFrom || MIN_AGE);
const ageToOptions = buildAgeOptions(currAgeTo || MAX_AGE);

function restrictAgeToOptions() {
  const ageFromVal = ageFromElem.val();
  ageToElem.children().each((val, option) => {
    $(option).attr('disabled', val < ageFromVal);
  });
  const ageToVal = ageToElem.val();
  if (parseInt(ageFromVal, 10) > ageToVal) {
    ageToElem.val(ageFromVal);
  }
}

ageFromElem.append(ageFromOptions);
ageFromElem.change(() => {
  restrictAgeToOptions();
  refreshMap();
});
ageToElem.append(ageToOptions);
ageToElem.change(refreshMap);
restrictAgeToOptions();

// Build legend (key)
const legendItems = _.zip(COLORS, MIN_PERCENTAGES, MAX_PERCENTAGES).map(
		([color, minPercentage, maxPercentage]) => {
  return `
    <div>
      <div
        class="color-box"
        style="background-color: ${color}; opacity: ${LAYER_OPACITY}">
      </div>
      <span>${formatPercentage(minPercentage, 4)} to ${formatPercentage(maxPercentage, 4)}</span>
    </div>
  `;
});
$("#legend-items").append(legendItems);

const extraFiltersElem = $("#extra_filters");
const showFiltersElem = $("#show_filters");
const hideFiltersElem = $("#hide_filters");
showFiltersElem.click(_ => {
  extraFiltersElem.show();
  hideFiltersElem.show();
  showFiltersElem.hide();
});
hideFiltersElem.click(_ => {
  extraFiltersElem.hide();
  hideFiltersElem.hide();
  showFiltersElem.show();
});

const legendElem = $("#legend");
const showLegendElem = $("#show_legend");
const hideLegendElem = $("#hide_legend");
showLegendElem.click(_ => {
  legendElem.show();
  showLegendElem.hide();
});
hideLegendElem.click(_ => {
  legendElem.hide();
  showLegendElem.show();
});
