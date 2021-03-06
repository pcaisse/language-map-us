(function() {

  const mapDefaultBounds = [  // continental US
    [24.396308, -124.848974],
    [49.384358, -66.885444]
  ];

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
  );

  // Holds all layers currently shown on the map (for both states and PUMAs as
  // appropriate depending on the zoom level). The key is the 7-digit PUMA geo
  // id or the 2-digit state id. These are guaranteed to never conflict (state
  // id is 2 letter FIPS code -- eg. "42" -- and geo id is 2 letter FIPS of the
  // state plus the 5 letter PUMA code -- eg. "4203211").
  let layers;
  // PUMA outline layers.
  // These should be removed whenever we move to the PUMA level or to the
  // sufficiently zoomed out state level.
  let outlinePumaLayers;
  // Used for caching geometries
  let geometriesCache;
  // Web worker to access IndexedDB without blocking. Without using a web worker,
  const indexedDbWorker = new Worker("static/js/worker.js");

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

  const PUMA_OUTLINE_STYLE = {
    color: '#fff',
    weight: 1,
    dashArray: 5,
    opacity: 0.5,
    fill: false
  };

  const TOOLTIP_PROPERTIES = {
    permanent: false,
    direction: "auto",
    sticky: true,
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
    return L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });
  }

  function urlToPath(url) {
    return url.split('?')[0];
  }

  const spinner = $('.loader');

  // Keep track of chains of pending requests. PUMA outline requests are broken
  // up into multiple requests since both the URL becomes too long for a GET
  // request and the payload for a single request gets too big. This needs to
  // be in global scope so that requests for PUMA outlines can be cancelled.
  let pendingChainRequestRegistry = {};

  const fetchJSON = (() => {
    // Keep track of pending requests to abort when a new request is made
    let pendingRequestRegistry = {};

    return (url, isChainRequest) => {
      // NOTE: path is used for aborting pending requests to the same endpoint
      const path = urlToPath(url);
      return new Promise((resolve, reject) => {
        if (pendingRequestRegistry[path]) {
          pendingRequestRegistry[path].abort();
        }
        const request = $.getJSON(url, response => {
          if (response.success) {
            resolve(response.results);
          } else {
            reject(response.message);
          }
        }).always(() => {
          if (isChainRequest) {
            // Use the URL as a key since path is not unique.
            delete pendingChainRequestRegistry[url];
          } else {
            delete pendingRequestRegistry[path];
          }
        });
        if (isChainRequest) {
          pendingChainRequestRegistry[url] = request;
        } else {
          pendingRequestRegistry[path] = request;
        }
      }).catch(err => {
        if (err.status === 400) {
          console.error("Bad request", err.responseJSON.errors);
        } else {
          console.error(err);
        }
      });
    }
  })();

  function createLayerData({geojsonResults, geojsonCached, speakers}) {
    const geojsonData = _.keyBy(geojsonResults, "id");
    const speakerData = _.keyBy(speakers, "id");
    // Recursively merge all objects to combine data
    return _.merge(geojsonData, geojsonCached, speakerData);
  }

  function createOutlineLayerData({geojsonResults, geojsonCached}) {
    const geojsonData = _.keyBy(geojsonResults, "id");
    return _.merge(geojsonData, geojsonCached);
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

  function legendFractionDigits(percentage) {
    if (percentage === null) {
      return 0;
    }
    const numberLog = Math.log10(percentage * 100);
    return numberLog < 0 ?
      parseInt(Math.abs(numberLog)) :
      0;
  }

  function speakersFractionDigits(percentage, minFractionDigits) {
    if (percentage === null) {
      return 0;
    }
    const numberLog = Math.log10(percentage * 100);
    return numberLog < 0 ?
      parseInt(Math.abs(numberLog)) + 2 :
      minFractionDigits;
  }

  function formatLegendPercentage(percentage) {
    return formatPercentage(percentage, legendFractionDigits(percentage));
  }

  function formatSpeakersPercentage(percentage, minFractionDigits) {
    return formatPercentage(percentage,
        speakersFractionDigits(percentage, minFractionDigits));
  }

  function formatPercentage(percentage, fractionDigits) {
    return (percentage || 0).toLocaleString(undefined,
      {
        style: "percent",
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      }
    );
  }

  function formatTooltip(result) {
    return `
      <div class="area-name">${result.name}</div>
      <div class="area-speakers">
        <span class="area-speakers-label">Speakers:</span>
        <span class="area-speakers-count">${(result.sum_weight || 0).toLocaleString()}</span>
      </div>
      <div class="area-percentage">
        <span class="area-percentage-label">Percentage:</span>
        <span class="area-percentage-count">${formatSpeakersPercentage(result.percentage, 1)}</span>
      </div>
    `
  }

  function createOutlineLayers(layerData) {
    return Object.keys(layerData).reduce((acc, key) => {
      const data = layerData[key];
      const existingLayer = outlinePumaLayers && outlinePumaLayers[data["id"]];
      if (existingLayer) {
        // Do nothing to the layer.
        acc[data["id"]] = existingLayer;
      } else {
        // Create GeoJSON object from geometry
        acc[data["id"]] = L.geoJSON(
          data.geom,
          PUMA_OUTLINE_STYLE,
        );
      }
      return acc;
    }, {});
  }

  function createLayers(layerData) {
    return Object.keys(layerData).reduce((acc, key) => {
      const data = layerData[key];
      const existingLayer = layers && layers[data["id"]];
      const layerStyle = {
        fillColor: percentageToColor(data.percentage)
      };
      const label = formatTooltip(data);
      if (existingLayer) {
        // Re-use existing layer instead of creating a new one. This is actually
        // very important so that Leaflet is able to remove the layer when we're
        // done with it.
        if (existingLayer.getTooltip() && existingLayer.getTooltip().getContent() !== label) {
          // Re-bind tooltip with new data
          existingLayer
            .setStyle(layerStyle)
            .unbindTooltip()
            .bindTooltip(label, TOOLTIP_PROPERTIES);
        }
        acc[data["id"]] = existingLayer
      } else {
        // Create GeoJSON object from geometry, styled/labeled appropriately based
        // on speaker data
        acc[data["id"]] = L.geoJSON(
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

  function drawLayers(prevLayers, currLayers, nonBlocking = false) {
    const removeLayer = key => {
      const layer = prevLayers[key];
      // Remove old layers
      if (!currLayers[key]) {
        map.removeLayer(layer);
      }
    };
    if (prevLayers) {
      Object.keys(prevLayers).forEach(key => {
        if (nonBlocking) {
          setTimeout(() => removeLayer(key), 0);
        } else {
          removeLayer(key);
        }
      });
    }
    const addLayer = key => {
      const layer = currLayers[key];
      // Add new layers
      if (!prevLayers || !prevLayers[key]) {
        layer.addTo(map);
      }
    };
    Object.keys(currLayers).forEach(key => {
      if (nonBlocking) {
        setTimeout(() => addLayer(key), 0);
      } else {
        addLayer(key);
      }
    });
  }

  function removeOutlines(outlineLayers) {
    // Remove from map
    _.mapValues(outlineLayers, layer => {
      setTimeout(() => map.removeLayer(layer), 0);
    });
    // Remove from object
    outlinePumaLayers = {};
  }

  function cancelPendingChainRequests() {
    _.mapKeys(pendingChainRequestRegistry, function(request, url) {
      request.abort();
      delete pendingChainRequestRegistry[url];
    });
  }

  function fetchResults(showOutlines) {
    spinner.show();
    return fetchJSON('/api/speakers/' + window.location.search + (showOutlines ? '&includePumaIds=1' : ''))
      .then(speakerResults => {
        const results = {speakers: speakerResults};
        const areasToShow = speakerResults.map(result => result.id);
        return fetchGeometries(areasToShow, isStateLevel(), false)
        .then(geometryData => {
          return new Promise((resolve, _) => resolve(Object.assign(results, geometryData)));
        });
      }).finally(() => {
        spinner.hide();
      });
  }

  function fetchGeometries(geometryIds, stateLevel, pumaOutlines) {
    // Only fetch geometries that aren't cached
    const cachedGeometryIds = Object.keys(geometriesCache);
    const geometriesToFetch = _.difference(geometryIds, cachedGeometryIds);
    const geometriesToLoadFromCache = _.difference(geometryIds, geometriesToFetch);
    const cachedGeometries = _.pick(geometriesCache, geometryIds);
    if (geometriesToFetch.length) {
      // Fetch un-cached geometries
      const chunkedIds = _.chunk(geometriesToFetch, 200);
      const geojsonPromises = chunkedIds.map(ids => {
        return fetchJSON('/api/geojson/?level=' + levelStr(stateLevel) + '&ids=' + ids.join(','), pumaOutlines)
      });
      return Promise.all(geojsonPromises)
        .then(multipleGeojsonResults => ({
          geojsonResults: _.flatten(multipleGeojsonResults),
          geojsonCached: cachedGeometries,
        }));
    } else {
      // All geometries that need to be shown are cached
      return new Promise((resolve, _) => resolve({
        geojsonResults: [],
        geojsonCached: cachedGeometries,
      }));
    }
  }

  function isStateLevel() {
    return map.getZoom() < 8;
  }

  function shouldShowPumaOutlines() {
    const zoomLevel = map.getZoom();
    return zoomLevel === 6 || zoomLevel === 7;
  }

  function getSimplifiedMapBounds() {
    const bounds = map.getBounds();
    const boundingBoxStr = bounds.toBBoxString();
    const values = boundingBoxStr.split(',').map(parseFloat);
    return values.map(f => f.toFixed(2)).join(',');
  }

  const levelStr = stateLevel => stateLevel ? "state" : "puma";

  window.onpopstate = event => {
    // Set map to current bounding box
    map.fitBounds(boundingBoxStrToBounds(event.state.boundingBox));
  };

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

    const levelFilter = {
      level: levelStr(stateLevel)
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

  function updateFiltersDescription() {
    const currentLanguageName = languageElem.find('option:selected').text();
    const currentAgeFrom = parseInt(ageFromElem.find('option:selected').text());
    const currentAgeTo = parseInt(ageToElem.find('option:selected').text());
    if (currentAgeFrom !== MIN_AGE || currentAgeTo !== MAX_AGE) {
      currentAgeFromElem.html(currentAgeFrom);
      currentAgeToElem.html(currentAgeTo);
      currentAgeElem.show();
    } else {
      currentAgeElem.hide();
    }
    if (englishElem.val() !== ANY_VAL || citizenshipElem.val() !== ANY_VAL) {
      currentOtherFiltersElem.show();
    } else {
      currentOtherFiltersElem.hide();
    }
    currentLanguageElem.html(currentLanguageName);
  }

  function buildQueryString(filters) {
    const filtersArray = Object.keys(filters).map(key => [key, filters[key]]);
    return filtersArray.reduce((acc, [key, value], index) => {
      const separator = index === 0 ? "?" : "&";
      return acc + `${separator}${key}=${value}`;
    }, "");
  }

  function resultsToCached(geometries) {
    return geometries.reduce((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {});
  }

  const refreshMap = (() => {
    let prevShowOutlines;
    return () => {
      const stateLevel = isStateLevel();
      const showOutlines = shouldShowPumaOutlines();
      const stopShowingOutlines = prevShowOutlines && !showOutlines;
      if (stopShowingOutlines) {
        cancelPendingChainRequests();
        // Were showing PUMA outlines based on zoom level, but no longer are.
        // Remove outlines before redrawing map.
        removeOutlines(outlinePumaLayers);
      }
      prevShowOutlines = showOutlines;
      refreshUrl(stateLevel);
      if (isMobile) {
        updateFiltersDescription();
      }
      fetchResults(showOutlines).then(data => {
        // Get new map data and redraw map
        const layerData = createLayerData(data);
        const currLayers = createLayers(layerData);
        drawLayers(layers, currLayers);
        layers = currLayers;
        geometriesCache = Object.assign(geometriesCache, resultsToCached(data.geojsonResults));
        if (data.geojsonResults) {
          // Save geometries to IndexedDB
          indexedDbWorker.postMessage({
            msg: 'saveGeometries',
            geometries: data.geojsonResults,
          });
        }
        // Main layers are on map and geometries have been saved. Now that
        // the most important work is done, show PUMA outlines as necessary.
        if (showOutlines) {
          showPumaOutlines(data.speakers);
        }
      });
    };
  })();

  function showPumaOutlines(speakerData) {
    const allPumaIds = speakerData.reduce((acc, state) => acc.concat(state.puma_ids), []);
    fetchGeometries(allPumaIds, false, true).then(data => {
      // Add PUMA outlines to map
      const layerOutlineData = createOutlineLayerData(data);
      const currOutlineLayers = createOutlineLayers(layerOutlineData);
      // Draw outlines on map
      drawLayers(outlinePumaLayers, currOutlineLayers, true);
      // Save layers
      outlinePumaLayers = currOutlineLayers;
      // Manage cache
      geometriesCache = Object.assign(geometriesCache, resultsToCached(data.geojsonResults));
      // Save geometries to IndexedDB
      if (data.geojsonResults) {
        indexedDbWorker.postMessage({
          msg: 'saveGeometries',
          geometries: data.geojsonResults,
        });
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

  /**
   * Use cached value in localStorage if available. Otherwise, query API.
   */
  function cachedValueOrResponse(localStorageKey, apiPath) {
    const cachedValue = JSON.parse(localStorage.getItem(localStorageKey));
    if (cachedValue) {
      return Promise.resolve(cachedValue);
    } else {
      return fetchJSON(apiPath).then(fetchedValue => {
        localStorage.setItem(localStorageKey, JSON.stringify(fetchedValue));
        return fetchedValue;
      });
    }
  }

  // Filters description elements
  const filtersDescElem = $('#filters-desc');
  const currentLanguageElem = $('#current-language');
  const currentAgeElem = $('#current-age');
  const currentAgeFromElem = $('#current-age-from');
  const currentAgeToElem = $('#current-age-to');
  const currentOtherFiltersElem = $('#current-other-filters');

  Promise.all([
    cachedValueOrResponse('totalSpeakers', '/api/total_speakers'),
    cachedValueOrResponse('values', '/api/values'),
  ]).then(([totalSpeakerCounts, values]) => {
    // Top most spoken languages
    const topLanguages = _.take(totalSpeakerCounts.counts, 10).map(({id, name}) => {
      return options(null, id, name);
    });
    const topLanguagesGroup = $('<optgroup/>').attr('label', 'Top 10 Most Spoken Languages');
    topLanguagesGroup.append(topLanguages);
    languageElem.append(topLanguagesGroup);
    // Values for filters
    const {languages, englishSpeakingAbilities, citizenshipStatuses} = values;
    const currLanguageId = parseInt(queryStringLanguage, 10);
    // Language options
    const languageOptions = languages.map(({id, name}) => {
      return options(currLanguageId, id, name);
    });
    const allLanguagesGroup = $('<optgroup/>').attr('label', 'All Languages');
    allLanguagesGroup.append(languageOptions);
    languageElem.append(allLanguagesGroup);
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
    if (isMobile) {
      updateFiltersDescription();
      filtersDescElem.show();
    }
    // Create map
    createTiles().addTo(map);
    // Load geometries from IndexedDB asynchronously to populate geometriesCache
    indexedDbWorker.postMessage({
      msg: 'loadAllGeometries'
    });
    indexedDbWorker.onmessage = e => {
      // Load geometries into in-memory cache
      geometriesCache = e.data;
      refreshMap();
      map.on('moveend', _.debounce(refreshMap, 1000, {
        leading: false,
        trailing: true
      }));
    };
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
      <li class="legend__item">
        <div
          class="color-box"
          style="background-color: ${color}; opacity: ${LAYER_OPACITY}">
        </div>
        <span>${formatLegendPercentage(minPercentage)} to ${formatLegendPercentage(maxPercentage)}</span>
      </li>
    `;
  });
  $("#legend-items").append(legendItems);

  const parseLocalStorageFlag = val => typeof val === "string" ? !!+val : null;
  const isMobile = $(document).width() <= 1024;

  const legendElem = $("#legend");
  const showLegendElem = $("#show_legend");
  const hideLegendElem = $("#hide_legend");
  showLegendElem.click(_ => {
    showLegend();
    localStorage.setItem('showLegend', '1');
  });
  hideLegendElem.click(_ => {
    hideLegend();
    localStorage.setItem('showLegend', '0');
  });
  function showLegend() {
    legendElem.show();
    showLegendElem.hide();
  }
  function hideLegend() {
    legendElem.hide();
    showLegendElem.show();
  }
  const showLegendVal = parseLocalStorageFlag(localStorage.getItem('showLegend'));
  if (showLegendVal === false || (showLegendVal === null && isMobile)) {
    hideLegend();
  } else {
    showLegend();
  }

  // Hide/show navigation menu
  const toggleNavElem = $("#js-toggle-nav");
  const navElem = $("#js-nav");
  toggleNavElem.click(_ => {
    if (navElem.css("display") === "none") {
      // Avoid showing navigation menu and filters at the same time
      hideFilters(true);
      navElem.show();
    } else {
      hideFilters();
      navElem.hide();
    }
  });
  $(".nav__link").click(_ => {
    if (isMobile) {
      navElem.hide()
      hideFilters();
    }
  });

  // Hide/show filters
  const toggleFiltersElem = $("#js-toggle-filter");
  const filtersElem = $("#js-filters");
  const filtersCloseElem = $("#js-filters-close");
  const editFiltersElem = $("#js-edit-filters");
  filtersCloseElem.click(_ => hideFilters());
  editFiltersElem.click(showFilters);
  toggleFiltersElem.click(_ => {
    if (filtersElem.css("display") === "none") {
      showFilters();
    } else {
      hideFilters();
    }
  });
  function showFilters() {
    // Avoid showing navigation menu and filters at the same time
    filtersElem.show();
    navElem.hide();
    filtersDescElem.hide();
    toggleFiltersElem.addClass("active");
  }
  function hideFilters(hideDescription) {
    filtersElem.hide();
    if (hideDescription) {
      filtersDescElem.hide();
    } else {
      filtersDescElem.show();
    }
    toggleFiltersElem.removeClass("active");
  }

  // Search
  const searchElem = $('#search');
  const awesomplete = new Awesomplete(searchElem[0], {list: []});
  let searchResults = {};

  function searchGeometries(event) {
    const text = _.trim(event.target.value);
    if (text) {
      return fetchJSON("/api/search/?text=" + text).then(results => {
        searchResults = _.mapValues(_.keyBy(results, 'name'), 'bbox');
        awesomplete.list = _.map(results, 'name');
      });
    } else {
      searchResults = {};
      awesomplete.list = [];
    }
  }

  searchElem.on('keyup onpaste', _.debounce(searchGeometries, 500, {
    leading: false,
    trailing: true
  }));
  searchElem.on('awesomplete-selectcomplete', event => {
    const bbox = searchResults[event.target.value];
    if (bbox) {
      const bounds = [
        [bbox.coordinates[0][0][1], bbox.coordinates[0][0][0]],
        [bbox.coordinates[0][2][1], bbox.coordinates[0][2][0]],
      ];
      map.fitBounds(bounds);
    }
  });
  searchElem.on('focus click', event => event.target.value = '');
}());
