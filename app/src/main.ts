import _ from "lodash";
import { Map, MapLayerMouseEvent, Popup } from "maplibre-gl";
import {
  LAYER_OPACITY,
  PUMAS_LAYER_ID,
  PUMAS_MIN_ZOOM_LEVEL,
  PUMAS_OUTLINE_LAYER_ID,
  PUMAS_SOURCE_LAYER,
  STATES_LAYER_ID,
  STATES_OUTLINE_LAYER_ID,
  STATES_PUMAS_SOURCE_ID,
  STATES_SOURCE_LAYER,
  TOP_N,
  ZOOM_INFO_WAS_CLOSED_ID,
} from "./constants";
import {
  Area,
  LanguageCountsEntries,
  AppState,
  Filters,
  Year,
  YearRange,
  LanguageCode,
} from "./types";
import {
  buildChangeLegend,
  buildExploreItems,
  buildLanguageOptions,
  buildLegend,
  buildMobileFilters,
  buildYear,
  buildTooltip,
  buildSearchResultItems,
} from "./templates";
import {
  fillColor,
  validYears,
  isCommonLanguage,
  isMobile,
  isStateLevel,
  querySelectorThrows,
  topNLanguages,
  normalizeLanguageCode,
  geolevelToZoomLevel,
} from "./helpers";
import {
  parseCoordinates,
  parseGeolevel,
  parseLanguageCode,
  parseLanguageCodeUnsafe,
  parseQueryString,
  parseSingleYearUnsafe,
  parseYearUnsafe,
} from "./parse";
import { serialize } from "./serialize";
import { Coordinates, Geolevel, searchByPlaceName } from "us-places-geocoder";

// esbuild fills this in at build time using the env var of the same name
// @ts-expect-error
let style = BASEMAP_STYLE;

if (!style) {
  throw new Error("BASEMAP_STYLE not set");
}

// esbuild fills this in at build time using the env var of the same name
// @ts-expect-error
let tilesURL = TILES_URL;

if (!tilesURL) {
  throw new Error("TILES_URL not set");
}

const initialAppState = parseQueryString(window.location.search);
let appState: AppState = {
  ...initialAppState,
  filters: {
    ...initialAppState.filters,
    languageCode: normalizeLanguageCode(
      initialAppState.filters.year,
      initialAppState.filters.languageCode
    ).languageCode,
  },
};

let topCurrentYearLanguageCounts: LanguageCountsEntries | undefined;

const map = new Map({
  container: "map",
  style,
  bounds: appState.boundingBox,
  minZoom: 2,
  maxZoom: 12,
});

let tooltip: Popup | undefined;
// keep track of this for auto-hiding tooltip when states/PUMAs zoom threshold has been crossed
let prevZoom: number = map.getZoom();

function repaintLayers(filters: Filters) {
  if (tooltip) tooltip.remove();
  map.setPaintProperty(STATES_LAYER_ID, "fill-color", fillColor(filters));
  map.setPaintProperty(PUMAS_LAYER_ID, "fill-color", fillColor(filters));
}

// Initialize language select
const languageSelectElem =
  querySelectorThrows<HTMLSelectElement>("select#language");
const currentFiltersElem = querySelectorThrows("#current-filters");

function refreshLanguages(filters: Filters) {
  const { year, languageCode } = filters;
  const { languageCode: newLanguageCode, languageSet } = normalizeLanguageCode(
    year,
    languageCode
  );
  const languageCodeNamesSortedByName = _.sortBy(
    Object.entries(languageSet),
    ([_code, name]) => name
  ) as [LanguageCode, string][];
  languageSelectElem.innerHTML = buildLanguageOptions(
    newLanguageCode,
    languageCodeNamesSortedByName
  );
}
refreshLanguages(appState.filters);

languageSelectElem.addEventListener("change", () => {
  appState.filters.languageCode = parseLanguageCodeUnsafe(
    languageSelectElem.value
  );
  refreshView(appState.filters);
  updateQueryString(appState);
});

// Initialize year select
const yearContainerElem = querySelectorThrows("#year-container");
yearContainerElem.addEventListener("change", () => {
  const yearSelectElem = document.querySelector<HTMLSelectElement>("#year");
  const yearStartSelectElem =
    document.querySelector<HTMLSelectElement>("#year-start");
  const yearEndSelectElem =
    document.querySelector<HTMLSelectElement>("#year-end");
  if (yearSelectElem) {
    appState.filters.year = parseYearUnsafe(yearSelectElem.value);
  } else if (yearStartSelectElem && yearEndSelectElem) {
    appState.filters.year = [
      parseSingleYearUnsafe(yearStartSelectElem.value),
      parseSingleYearUnsafe(yearEndSelectElem.value),
    ];
  } else {
    throw new Error("no year select element found");
  }
  refreshView(appState.filters);
  updateQueryString(appState);
});
const notAllYearsElem = querySelectorThrows("#not-all-years");
function refreshYears(filters: Filters) {
  notAllYearsElem.style.display = isCommonLanguage(filters.languageCode)
    ? "none"
    : "block";
  yearContainerElem.innerHTML = buildYear(filters);
}
refreshYears(appState.filters);

const multipleYearsElem =
  querySelectorThrows<HTMLInputElement>("#multiple-years");
if (typeof appState.filters.year !== "number") {
  multipleYearsElem.checked = true;
}
multipleYearsElem.addEventListener("change", () => {
  const multipleYears = multipleYearsElem.checked;
  const { languageCode, year } = appState.filters;
  appState.filters.year =
    multipleYears && typeof year === "number"
      ? [validYears(year, languageCode)[0], year]
      : multipleYears && typeof year !== "number"
      ? [year[0], year[1]]
      : typeof year === "number"
      ? [year, year]
      : year[1];
  refreshYears(appState.filters);
  refreshView(appState.filters);
  updateQueryString(appState);
});

function refreshMobile(filters: Filters) {
  currentFiltersElem.innerHTML = buildMobileFilters(filters);
}

/*
 * Refresh view based on changes to filters (language or year).
 */
function refreshView(filters: Filters) {
  repaintLayers(filters);
  refreshLegend(filters.year);
  refreshExplore(filters.year);
  refreshLogo(filters.year);
  refreshLanguages(filters);
  refreshYears(filters);
  refreshMobile(filters);
}

// Initialize labels for mobile
refreshMobile(appState.filters);

// Zoom info element
const zoomInfoElem = querySelectorThrows("#zoom-info");
const hideZoomInfoElem = querySelectorThrows("#hide-zoom-info");
hideZoomInfoElem.addEventListener("click", () => {
  zoomInfoElem.style.display = "none";
  localStorage.setItem(ZOOM_INFO_WAS_CLOSED_ID, "true");
});

// Build legend
const legendElem = querySelectorThrows("#legend");
function refreshLegend(year: Year | YearRange) {
  const legendContent =
    typeof year === "number" ? buildLegend() : buildChangeLegend();
  legendElem.innerHTML = legendContent;
  const showLegendElem = querySelectorThrows("#show_legend");
  const hideLegendElem = querySelectorThrows("#hide_legend");
  showLegendElem.addEventListener("click", () => {
    legendElem.style.display = "block";
    showLegendElem.style.display = "none";
  });
  hideLegendElem.addEventListener("click", () => {
    legendElem.style.display = "none";
    showLegendElem.style.display = "block";
  });
}
refreshLegend(appState.filters.year);

// Hide/show navigation menu
const toggleNavElem = querySelectorThrows("#js-toggle-nav");
const navElem = querySelectorThrows("#js-nav");
toggleNavElem.addEventListener("click", () => {
  if (window.getComputedStyle(navElem).display === "none") {
    // Avoid showing navigation menu and filters at the same time
    hideFilters(true);
    navElem.style.display = "block";
  } else {
    hideFilters(false);
    navElem.style.display = "none";
  }
});
const navLinkElem = querySelectorThrows(".nav__link");
navLinkElem.addEventListener("click", () => {
  if (isMobile) {
    navElem.style.display = "none";
    hideFilters(false);
  }
});

const logoElem = querySelectorThrows<HTMLImageElement>("#logo");
function refreshLogo(year: Year | YearRange) {
  const src =
    typeof year === "number" ? "img/us-map-20.png" : "img/us-map-20-yellow.png";
  logoElem.src = src;
  logoElem.style.visibility = "visible";
}
refreshLogo(appState.filters.year);

function searchAndUpdateResults(
  searchTerms: string,
  hideResults: boolean = false
) {
  const searchResults = searchTerms ? searchByPlaceName(searchTerms) : [];
  const searchResultItems = buildSearchResultItems(searchResults);
  searchResultsElem.style.display =
    searchResults.length && !hideResults ? "block" : "none";
  searchResultsElem.innerHTML = searchResultItems;
}

const searchElem = querySelectorThrows<HTMLInputElement>("#search");
const searchTermsElem = querySelectorThrows<HTMLInputElement>("#search-terms");
const searchResultsElem =
  querySelectorThrows<HTMLInputElement>("#search-results");
searchTermsElem.addEventListener("input", (event: Event) => {
  const searchTerms = (event.target as HTMLInputElement).value;
  searchAndUpdateResults(searchTerms);
});

function extractSearchResultItemData(elem: HTMLElement):
  | {
      name: string;
      coordinates: Coordinates;
      geolevel: Geolevel;
    }
  | undefined {
  const name = "name" in elem.dataset ? elem.dataset.name : undefined;
  const coordinates =
    "coordinates" in elem.dataset && elem.dataset.coordinates
      ? parseCoordinates(elem.dataset.coordinates)
      : undefined;
  const geolevel =
    "geolevel" in elem.dataset && elem.dataset.geolevel
      ? parseGeolevel(elem.dataset.geolevel)
      : undefined;
  if (name && coordinates && geolevel) {
    return { name, coordinates, geolevel };
  }
  return undefined;
}

function selectSearchResult(result: {
  name: string;
  coordinates: Coordinates;
  geolevel: Geolevel;
}) {
  searchResultsElem.style.display = "none";
  searchTermsElem.value = result.name;
  map.flyTo({
    center: { lat: result.coordinates[0], lng: result.coordinates[1] },
    zoom: geolevelToZoomLevel(result.geolevel),
  });
  searchAndUpdateResults(result.name, true);
}

searchTermsElem.addEventListener("focus", () => {
  searchResultsElem.style.display = "block";
});
searchTermsElem.addEventListener("blur", (e: FocusEvent) => {
  if (e.target instanceof HTMLElement && e.target.id !== "search-terms") {
    searchResultsElem.style.display = "none";
  }
});
searchResultsElem.addEventListener("click", (e: MouseEvent) => {
  if (e.target instanceof HTMLElement) {
    const result = extractSearchResultItemData(e.target);
    if (result) {
      selectSearchResult(result);
    }
  }
});
searchResultsElem.addEventListener("mouseover", ({ target }: MouseEvent) => {
  if (target instanceof Element) {
    target.classList.add("highlighted");
  }
});
searchResultsElem.addEventListener("mouseout", ({ target }: MouseEvent) => {
  if (target instanceof Element) {
    target.classList.remove("highlighted");
  }
});
searchElem.addEventListener("keydown", (e: KeyboardEvent) => {
  const isDown = e.code === "ArrowDown";
  const isUp = e.code === "ArrowUp";
  const isEnter = e.code === "Enter";
  const searchResultItems = document.querySelectorAll(".search-result-items");
  if (isDown || isUp) {
    if (
      Array.from(searchResultItems).some((elem) =>
        elem.classList.contains("highlighted")
      )
    ) {
      // At least one search result is already highlighted
      for (let i = 0; i < searchResultItems.length; i++) {
        const elem = searchResultItems[i];
        if (elem.classList.contains("highlighted")) {
          if (isDown && i < searchResultItems.length - 1) {
            const nextElem = searchResultItems[i + 1];
            elem.classList.remove("highlighted");
            nextElem.classList.add("highlighted");
            break;
          } else if (isUp && i > 0) {
            const prevElem = searchResultItems[i - 1];
            elem.classList.remove("highlighted");
            prevElem.classList.add("highlighted");
            break;
          }
        }
      }
    } else {
      const elemToHighlight = isDown
        ? searchResultItems[0]
        : searchResultItems[searchResultItems.length - 1];
      elemToHighlight.classList.add("highlighted");
    }
  } else if (isEnter) {
    const highlightedItem = Array.from(searchResultItems).find((elem) =>
      elem.classList.contains("highlighted")
    );
    if (highlightedItem && highlightedItem instanceof HTMLElement) {
      const result = extractSearchResultItemData(highlightedItem);
      if (result) {
        selectSearchResult(result);
      }
    }
  }
});

// Hide/show filters
const filtersElem = querySelectorThrows("#js-filters");
const filtersCloseElem = querySelectorThrows("#js-filters-close");
const editFiltersElem = querySelectorThrows("#js-edit-filters");
const filtersDescElem = querySelectorThrows("#filters-desc");
filtersCloseElem.addEventListener("click", () => hideFilters(false));
editFiltersElem.addEventListener("click", () => showFilters());
const showFilters = () => {
  // Avoid showing navigation menu and filters at the same time
  filtersElem.style.display = "block";
  navElem.style.display = "none";
  filtersDescElem.style.display = "none";
  searchElem.style.display = "none";
};
const hideFilters = (hideDescription: boolean) => {
  filtersElem.style.display = "none";
  if (hideDescription) {
    filtersDescElem.style.display = "none";
    searchElem.style.display = "none";
  } else {
    filtersDescElem.style.display = "block";
    searchElem.style.display = "block";
  }
};

// Check for explore items container for appending later
const exploreElem = querySelectorThrows("#explore");
const exploreItemsContainerElem = querySelectorThrows("#explore-items");
const updateExploreItems = () => {
  if (exploreItemsContainerElem && topCurrentYearLanguageCounts) {
    const exploreItems = buildExploreItems(topCurrentYearLanguageCounts);
    exploreItemsContainerElem.innerHTML = exploreItems;
  }
};
function refreshExplore(year: Year | YearRange) {
  // Don't show most spoken languages in visible area on mobile because it's not useful
  if (!isMobile) {
    updateExploreItems();
    exploreElem.style.display = typeof year === "number" ? "block" : "none";
  }
}
const onLanguageLinkContainerClick = (e: MouseEvent) => {
  // Avoid pushing state to history
  e.preventDefault();
  const languageCode =
    e.target &&
    "dataset" in e.target &&
    e.target.dataset &&
    typeof e.target.dataset === "object" &&
    "languageCode" in e.target.dataset &&
    e.target.dataset.languageCode &&
    typeof e.target.dataset.languageCode === "string"
      ? parseLanguageCode(e.target.dataset.languageCode)
      : undefined;
  if (!languageCode) {
    throw new Error(`unrecognized language code: ${languageCode}`);
  }
  updateSelectValue(languageSelectElem, languageCode);
};
exploreItemsContainerElem.addEventListener(
  "click",
  onLanguageLinkContainerClick
);

function updateSelectValue(selectElem: HTMLSelectElement, newValue: string) {
  selectElem.value = newValue;
  selectElem.dispatchEvent(new Event("change"));
}

function updateQueryString(state: AppState): void {
  // Update URL so it's shareable
  const queryString = serialize(state);
  if (queryString !== window.location.search) {
    // Always replace history state when app state changes so that the map and
    // the URL are in sync. Replacing instead of pushing allows for avoiding
    // polluting history with every map interaction and makes syncing app state
    // and URL very simple.
    window.history.replaceState(state, "", "/?" + queryString);
  }
}

// Configure map layers and interactions
map.on("load", function () {
  const layers = map.getStyle().layers;
  let firstPlaceLayerId;
  for (const layer of layers) {
    if (layer.type === "symbol" && layer["source-layer"] === "place") {
      if (!firstPlaceLayerId) {
        // Save first place layer to add other layers beneath it
        firstPlaceLayerId = layer.id;
      }
      // Style place labels for readibility
      map.setPaintProperty(layer.id, "text-color", "#222");
      map.setPaintProperty(layer.id, "text-halo-blur", 1);
      map.setPaintProperty(layer.id, "text-halo-width", 1);
      map.setLayoutProperty(layer.id, "text-size", 14);
    }
  }
  map.addSource(STATES_PUMAS_SOURCE_ID, {
    type: "vector",
    tiles: [tilesURL],
    maxzoom: 14,
  });
  // pumas
  map.addLayer(
    {
      id: PUMAS_LAYER_ID,
      type: "fill",
      source: STATES_PUMAS_SOURCE_ID,
      "source-layer": PUMAS_SOURCE_LAYER,
      paint: {
        // TODO: Figure out issue with types here
        // @ts-expect-error
        "fill-color": fillColor(appState.filters),
        "fill-opacity": LAYER_OPACITY,
      },
    },
    // Add layer below first symbol layer so place names from basemap are visible
    firstPlaceLayerId
  );
  map.addLayer(
    {
      id: PUMAS_OUTLINE_LAYER_ID,
      type: "line",
      source: STATES_PUMAS_SOURCE_ID,
      "source-layer": PUMAS_SOURCE_LAYER,
      paint: {
        "line-color": "#ccc",
        "line-width": 1,
      },
    },
    // Add layer below first symbol layer so place names from basemap are visible
    firstPlaceLayerId
  );
  // states
  map.addLayer(
    {
      id: STATES_LAYER_ID,
      source: STATES_PUMAS_SOURCE_ID,
      "source-layer": STATES_SOURCE_LAYER,
      type: "fill",
      paint: {
        // TODO: Figure out issue with types here
        // @ts-expect-error
        "fill-color": fillColor(appState.filters),
        "fill-opacity": LAYER_OPACITY,
      },
    },
    // States need to show on top of PUMAS layer so they are clickable
    PUMAS_LAYER_ID
  );
  map.addLayer(
    {
      id: STATES_OUTLINE_LAYER_ID,
      source: STATES_PUMAS_SOURCE_ID,
      "source-layer": STATES_SOURCE_LAYER,
      type: "line",
      paint: {
        "line-color": "#ccc",
        "line-width": 1,
      },
    },
    // States need to show on top of PUMAS layer so they are clickable
    PUMAS_LAYER_ID
  );

  map.on("render", () => {
    const zoom = map.getZoom();
    // Hide tooltip if states/PUMAs zoom threshold was crossed
    if (
      tooltip &&
      ((zoom > PUMAS_MIN_ZOOM_LEVEL && prevZoom <= PUMAS_MIN_ZOOM_LEVEL) ||
        (zoom <= PUMAS_MIN_ZOOM_LEVEL && prevZoom > PUMAS_MIN_ZOOM_LEVEL))
    ) {
      tooltip.remove();
    }
    zoomInfoElem.style.display =
      zoom >= PUMAS_MIN_ZOOM_LEVEL ||
      localStorage.getItem(ZOOM_INFO_WAS_CLOSED_ID) !== null
        ? "none"
        : "block";
    prevZoom = zoom;
  });

  const mapUpdate = (): void =>
    updateQueryString({
      filters: appState.filters,
      boundingBox: map.getBounds(),
    });
  map.on("moveend", mapUpdate);
  map.on("touchend", mapUpdate);

  map.on("data", () => {
    if (!map.isSourceLoaded(STATES_PUMAS_SOURCE_ID)) return;
    const features = map.querySourceFeatures(STATES_PUMAS_SOURCE_ID, {
      sourceLayer: isStateLevel(map) ? STATES_SOURCE_LAYER : PUMAS_SOURCE_LAYER,
    });
    // TODO: Decode data properly to avoid type assertion here
    const areas = features.map((feature) => feature.properties) as Area[];
    if (!areas.length) return;
    const year =
      typeof appState.filters.year === "number"
        ? appState.filters.year
        : // default to end year since that's what we switch to when moving
          // from multiple years to single year
          appState.filters.year[1];
    topCurrentYearLanguageCounts = topNLanguages(areas, year, TOP_N);
    refreshExplore(appState.filters.year);
  });

  const showTooltip = (isState: boolean) => (e: MapLayerMouseEvent) => {
    // TODO: Decode data properly to avoid type assertion here
    const area =
      "features" in e && e.features && (e.features[0].properties as Area);
    if (area) {
      if (tooltip) tooltip.remove();
      tooltip = new Popup()
        .setLngLat(e.lngLat)
        .setHTML(buildTooltip(area, appState.filters, isState))
        .addTo(map);
      const tooltipElem = tooltip.getElement();
      tooltipElem.addEventListener("click", (event: MouseEvent) => {
        // Avoid default link behavior so as not to write to history
        event.preventDefault();
        const { target } = event;
        if (target instanceof Element && target.classList.contains("zoom-to")) {
          map.flyTo({ center: e.lngLat, zoom: PUMAS_MIN_ZOOM_LEVEL });
          if (tooltip) tooltip.remove();
        }
      });
      tooltipElem.addEventListener("click", onLanguageLinkContainerClick);
    }
  };

  map.on("click", PUMAS_LAYER_ID, showTooltip(false));
  map.on("click", STATES_LAYER_ID, showTooltip(true));

  const setCursorPointer = () => (map.getCanvas().style.cursor = "pointer");
  const setCursorBlank = () => (map.getCanvas().style.cursor = "");

  map.on("mouseenter", PUMAS_LAYER_ID, setCursorPointer);
  map.on("mouseleave", PUMAS_LAYER_ID, setCursorBlank);

  map.on("mouseenter", STATES_LAYER_ID, setCursorPointer);
  map.on("mouseleave", STATES_LAYER_ID, setCursorBlank);
});
