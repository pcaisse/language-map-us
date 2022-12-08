import _ from "lodash";
import { Map, MapLayerMouseEvent, Popup } from "maplibre-gl";
import {
  LANGUAGES,
  LAYER_OPACITY,
  PUMAS_LAYER_ID,
  PUMAS_MIN_ZOOM_LEVEL,
  PUMAS_SOURCE_LAYER,
  STATES_LAYER_ID,
  STATES_PUMAS_SOURCE_ID,
  STATES_SOURCE_LAYER,
  TOP_N,
  YEARS,
} from "./constants";
import { Area, LanguageCountsEntries, AppState } from "./types";
import {
  buildExploreItems,
  buildLegendItems,
  fillColor,
  formatTooltip,
  isMobile,
  isStateLevel,
  querySelectorThrows,
  topNLanguages,
} from "./helpers";
import {
  parseLanguageCode,
  parseLanguageCodeUnsafe,
  parseURL,
  parseYearUnsafe,
} from "./parse";
import { serialize } from "./serialize";

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

let appState = parseURL(window.location.search);

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

function repaintLayers() {
  if (tooltip) tooltip.remove();
  map.setPaintProperty(
    STATES_LAYER_ID,
    "fill-color",
    fillColor(appState.filters)
  );
  map.setPaintProperty(
    PUMAS_LAYER_ID,
    "fill-color",
    fillColor(appState.filters)
  );
}

// Initialize language select
const languageSelectElem =
  querySelectorThrows<HTMLSelectElement>("select#language");
const currentLanguageElem = querySelectorThrows("#current-language");
const languagesSortedByName = _.sortBy(
  Object.entries(LANGUAGES),
  ([_code, name]) => name
);
languagesSortedByName.forEach(([code, label]) => {
  const option = document.createElement("option");
  option.value = code;
  option.selected = code === appState.filters.languageCode;
  option.innerHTML = label;
  languageSelectElem.appendChild(option);
});
languageSelectElem.addEventListener("change", () => {
  appState.filters.languageCode = parseLanguageCodeUnsafe(
    languageSelectElem.value
  );
  repaintLayers();
  currentLanguageElem.innerHTML = LANGUAGES[appState.filters.languageCode];
  updateURL(appState);
});
// Initialize current language display (for mobile)
currentLanguageElem.innerHTML = LANGUAGES[appState.filters.languageCode];

// Initialize year select
const yearSelectElem = querySelectorThrows<HTMLSelectElement>("select#year");
const currentYearElem = querySelectorThrows("#current-year");
const yearsDesc = [...YEARS].sort((a, b) => b - a);
yearsDesc.forEach((year) => {
  const option = document.createElement("option");
  option.value = String(year);
  option.selected = year === appState.filters.year;
  option.innerHTML = String(year);
  yearSelectElem.appendChild(option);
});
yearSelectElem.addEventListener("change", () => {
  appState.filters.year = parseYearUnsafe(yearSelectElem.value);
  repaintLayers();
  currentYearElem.innerHTML = String(appState.filters.year);
  updateURL(appState);
});
// Initialize current year display (for mobile)
currentYearElem.innerHTML = String(appState.filters.year);

// Build legend
const legendElem = querySelectorThrows("#legend");
const legendItems = buildLegendItems();
const legendItemsContainerElem = querySelectorThrows("#legend-items");
legendItemsContainerElem.innerHTML = legendItems;
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

// Hide/show navigation menu
const toggleNavElem = querySelectorThrows("#js-toggle-nav");
const navElem = querySelectorThrows("#js-nav");
toggleNavElem.addEventListener("click", () => {
  if (navElem.style.display === "none") {
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

// Hide/show filters
const toggleFiltersElem = querySelectorThrows("#js-toggle-filter");
const filtersElem = querySelectorThrows("#js-filters");
const filtersCloseElem = querySelectorThrows("#js-filters-close");
const editFiltersElem = querySelectorThrows("#js-edit-filters");
const filtersDescElem = querySelectorThrows("#filters-desc");
filtersCloseElem.addEventListener("click", () => hideFilters(false));
editFiltersElem.addEventListener("click", () => showFilters());
toggleFiltersElem.addEventListener("click", () => {
  if (filtersElem.style.display === "none") {
    showFilters();
  } else {
    hideFilters(false);
  }
});
const showFilters = () => {
  // Avoid showing navigation menu and filters at the same time
  filtersElem.style.display = "block";
  navElem.style.display = "none";
  filtersDescElem.style.display = "none";
  toggleFiltersElem.classList.add("active");
};
const hideFilters = (hideDescription: boolean) => {
  filtersElem.style.display = "none";
  if (hideDescription) {
    filtersDescElem.style.display = "none";
  } else {
    filtersDescElem.style.display = "block";
  }
  toggleFiltersElem.classList.remove("active");
};

// Check for explore items container for appending later
const exploreItemsContainerElem = querySelectorThrows("#explore-items");
const updateExploreItems = () => {
  if (exploreItemsContainerElem && topCurrentYearLanguageCounts) {
    const exploreItems = buildExploreItems(topCurrentYearLanguageCounts);
    exploreItemsContainerElem.innerHTML = exploreItems;
  }
};
exploreItemsContainerElem.addEventListener("click", (e: MouseEvent) => {
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
  languageSelectElem.value = languageCode;
  languageSelectElem.dispatchEvent(new Event("change"));
});

function updateURL(state: AppState): void {
  // Update URL so it's shareable
  const url = window.location.origin + "?" + serialize(state);
  if (url !== window.location.href) {
    window.history.pushState(state, "Map refresh", url);
  }
}

// Configure map layers and interactions
map.on("load", function () {
  map.addSource(STATES_PUMAS_SOURCE_ID, {
    type: "vector",
    tiles: [tilesURL],
    maxzoom: 14,
  });
  // pumas
  map.addLayer({
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
  });
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
    prevZoom = zoom;
  });

  const update = (): void =>
    updateURL({
      filters: appState.filters,
      boundingBox: map.getBounds(),
    });
  map.on("moveend", update);
  map.on("zoomend", update);
  map.on("touchend", update);

  map.on("data", () => {
    if (!map.isSourceLoaded(STATES_PUMAS_SOURCE_ID)) return;
    // NOTE: Types seem to be incorrect here... `filter` array property is said
    // to be required for `querySourceFeatures` but adding a value of an empty
    // array causes runtime errors to be thrown
    // @ts-expect-error
    const features = map.querySourceFeatures(STATES_PUMAS_SOURCE_ID, {
      sourceLayer: isStateLevel(map) ? STATES_SOURCE_LAYER : PUMAS_SOURCE_LAYER,
    });
    // TODO: Decode data properly to avoid type assertion here
    const areas = features.map((feature) => feature.properties) as Area[];
    if (!areas.length) return;
    topCurrentYearLanguageCounts = topNLanguages(
      areas,
      appState.filters.year,
      TOP_N
    );
    updateExploreItems();
  });

  const showTooltip = (isState: boolean) => (e: MapLayerMouseEvent) => {
    // TODO: Decode data properly to avoid type assertion here
    const area =
      "features" in e && e.features && (e.features[0].properties as Area);
    if (area) {
      if (tooltip) tooltip.remove();
      tooltip = new Popup()
        .setLngLat(e.lngLat)
        .setHTML(formatTooltip(area, appState.filters, isState))
        .addTo(map);
      tooltip.getElement().addEventListener("click", ({ target }) => {
        if (target instanceof Element && target.classList.contains("zoom-to")) {
          map.flyTo({ center: e.lngLat, zoom: PUMAS_MIN_ZOOM_LEVEL });
          if (tooltip) tooltip.remove();
        }
      });
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
