import _ from "lodash";
import { LngLatBounds, Map, MapLayerMouseEvent, Popup } from "maplibre-gl";
import { parse, stringify } from "qs";
import {
  DEFAULT_BOUNDS,
  DEFAULT_LANGUAGE,
  DEFAULT_YEAR,
  LAYER_OPACITY,
  PUMAS_LAYER_ID,
  PUMAS_SOURCE_LAYER,
  STATES_LAYER_ID,
  STATES_PUMAS_SOURCE_ID,
  STATES_SOURCE_LAYER,
  TOP_N,
} from "./constants";
import { Area, Filters, LANGUAGES, LanguageCountsEntries, YEARS } from "./data";
import {
  buildExploreItems,
  buildLegendItems,
  fillColor,
  formatTooltip,
  isMobile,
  isStateLevel,
  topNLanguages,
} from "./helpers";

type MapState = {
  boundingBox: LngLatBounds;
};
type FilterState = {
  filters: Filters;
};
type AppState = MapState & FilterState;

let appState = parseURL(window.location.search);

let topCurrentYearLanguageCounts: LanguageCountsEntries | undefined;

// esbuild fills this in at build time using the env var of the same name
// @ts-expect-error
let style = BASEMAP_STYLE;

if (!style) {
  throw new Error("BASEMAP_STYLE not set");
}

const map = new Map({
  container: "map",
  style,
  bounds: appState.boundingBox,
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
const languageSelectElem: HTMLSelectElement | null =
  document.querySelector("select#language");
if (!languageSelectElem) {
  throw new Error("missing language select element");
}
const currentLanguageElem = document.getElementById("current-language");
if (!currentLanguageElem) {
  throw new Error("missing current language element");
}
Object.entries(LANGUAGES).forEach(([code, label]) => {
  const option = document.createElement("option");
  option.value = code;
  option.selected = code === appState.filters.languageCode;
  option.innerHTML = label;
  languageSelectElem.appendChild(option);
});
languageSelectElem.addEventListener("change", () => {
  // @ts-expect-error
  appState.filters.languageCode =
    // TODO: Use zod decoder to ensure value is valid
    languageSelectElem.value;
  repaintLayers();
  currentLanguageElem.innerHTML = LANGUAGES[appState.filters.languageCode];
  updateURL(appState);
});
// Initialize current language display (for mobile)
currentLanguageElem.innerHTML = LANGUAGES[appState.filters.languageCode];

// Initialize year select
const yearSelectElem: HTMLSelectElement | null =
  document.querySelector("select#year");
if (!yearSelectElem) {
  throw new Error("missing year select element");
}
const currentYearElem = document.getElementById("current-year");
if (!currentYearElem) {
  throw new Error("missing current year element");
}
YEARS.forEach((year) => {
  const option = document.createElement("option");
  option.value = year;
  option.selected = year === appState.filters.year;
  option.innerHTML = year;
  yearSelectElem.appendChild(option);
});
yearSelectElem.addEventListener("change", () => {
  // @ts-expect-error
  appState.filters.year =
    // TODO: Use zod decoder to ensure value is valid
    yearSelectElem.value;
  repaintLayers();
  currentYearElem.innerHTML = appState.filters.year;
  updateURL(appState);
});
// Initialize current year display (for mobile)
currentYearElem.innerHTML = appState.filters.year;

// Build legend
const legendElem = document.getElementById("legend");
if (!legendElem) {
  throw new Error("missing legend element");
}
const legendItems = buildLegendItems();
const legendItemsContainerElem = document.getElementById("legend-items");
if (!legendItemsContainerElem) {
  throw new Error("missing legend items container element");
}
legendItemsContainerElem.innerHTML = legendItems;
const showLegendElem = document.getElementById("show_legend");
if (!showLegendElem) {
  throw new Error("missing show legend element");
}
const hideLegendElem = document.getElementById("hide_legend");
if (!hideLegendElem) {
  throw new Error("missing hide legend element");
}
showLegendElem.addEventListener("click", () => {
  legendElem.style.display = "block";
  showLegendElem.style.display = "none";
});
hideLegendElem.addEventListener("click", () => {
  legendElem.style.display = "none";
  showLegendElem.style.display = "block";
});

// Hide/show navigation menu
const toggleNavElem = document.getElementById("js-toggle-nav");
if (!toggleNavElem) {
  throw new Error("toggle nav element missing");
}
const navElem = document.getElementById("js-nav");
if (!navElem) {
  throw new Error("nav element missing");
}
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
const navLinkElem = document.getElementsByClassName("nav__link")[0];
if (!navLinkElem) {
  throw new Error("nav link element missing");
}
navLinkElem.addEventListener("click", () => {
  if (isMobile) {
    navElem.style.display = "none";
    hideFilters(false);
  }
});

// Hide/show filters
const toggleFiltersElem = document.getElementById("js-toggle-filter");
if (!toggleFiltersElem) {
  throw new Error("toggle filters element missing");
}
const filtersElem = document.getElementById("js-filters");
if (!filtersElem) {
  throw new Error("filters element missing");
}
const filtersCloseElem = document.getElementById("js-filters-close");
if (!filtersCloseElem) {
  throw new Error("filters close element missing");
}
const editFiltersElem = document.getElementById("js-edit-filters");
if (!editFiltersElem) {
  throw new Error("edit filters element missing");
}
const filtersDescElem = document.getElementById("filters-desc");
if (!filtersDescElem) {
  throw new Error("filters description element missing");
}
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
const exploreItemsContainerElem = document.getElementById("explore-items");
if (!exploreItemsContainerElem) {
  throw new Error("missing explore items container element");
}
const updateExploreItems = () => {
  if (exploreItemsContainerElem && topCurrentYearLanguageCounts) {
    const exploreItems = buildExploreItems(topCurrentYearLanguageCounts);
    exploreItemsContainerElem.innerHTML = exploreItems;
  }
};
exploreItemsContainerElem.addEventListener("click", (e: MouseEvent) => {
  // TODO: decode languageCode via zod
  const languageCode =
    e.target &&
    "dataset" in e.target &&
    e.target.dataset &&
    typeof e.target.dataset === "object" &&
    "languageCode" in e.target.dataset &&
    e.target.dataset.languageCode;
  // @ts-expect-error
  languageSelectElem.value = languageCode;
  languageSelectElem.dispatchEvent(new Event("change"));
});

function parseURL(queryString: string): AppState {
  const {
    // @ts-expect-error
    filters: { languageCode, year },
    boundingBox,
  } = parse(queryString, {
    ignoreQueryPrefix: true,
  });
  return {
    filters: {
      languageCode: languageCode ?? DEFAULT_LANGUAGE,
      year: year ?? DEFAULT_YEAR,
    },
    boundingBox:
      // @ts-expect-error
      boundingBox && boundingBox._ne && boundingBox._sw
        ? new LngLatBounds(
            // @ts-expect-error
            _.mapValues(boundingBox._ne, parseFloat),
            // @ts-expect-error
            _.mapValues(boundingBox._sw, parseFloat)
          )
        : DEFAULT_BOUNDS,
  };
}

function updateURL(state: AppState): void {
  // Update URL so it's shareable
  const url = window.location.origin + "?" + stringify(state);
  if (url !== window.location.href) {
    window.history.pushState(state, "Map refresh", url);
  }
}

// Configure map layers and interactions
map.on("load", function () {
  map.addSource(STATES_PUMAS_SOURCE_ID, {
    type: "vector",
    tiles: ["http://localhost:3000/tiles/{z}/{x}/{y}.pbf"],
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
      ((zoom > 7 && prevZoom <= 7) || (zoom <= 7 && prevZoom > 7))
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
    // TODO: Use zod decoder to ensure value is valid
    // @ts-expect-error
    const features = map.querySourceFeatures(STATES_PUMAS_SOURCE_ID, {
      sourceLayer: isStateLevel(map) ? STATES_SOURCE_LAYER : PUMAS_SOURCE_LAYER,
    });
    // @ts-expect-error
    const areas: Area[] = features.map((feature) => feature.properties);
    if (!areas.length) return;
    topCurrentYearLanguageCounts = topNLanguages(
      areas,
      appState.filters.year,
      TOP_N
    );
    updateExploreItems();
  });

  function showTooltip(e: MapLayerMouseEvent) {
    const area =
      "features" in e && e.features && (e.features[0].properties as Area);
    if (area) {
      if (tooltip) tooltip.remove();
      tooltip = new Popup()
        .setLngLat(e.lngLat)
        .setHTML(formatTooltip(area, appState.filters))
        .addTo(map);
    }
  }

  map.on("click", PUMAS_LAYER_ID, showTooltip);
  map.on("click", STATES_LAYER_ID, showTooltip);

  map.on("mouseenter", PUMAS_LAYER_ID, function () {
    map.getCanvas().style.cursor = "pointer";
  });

  map.on("mouseleave", PUMAS_LAYER_ID, function () {
    map.getCanvas().style.cursor = "";
  });
});
