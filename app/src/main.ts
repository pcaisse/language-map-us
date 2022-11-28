import { Map, MapLayerMouseEvent, Popup } from "maplibre-gl";
import {
  fillColor,
  LAYER_OPACITY,
  PUMAS_LAYER_ID,
  PUMAS_SOURCE_LAYER,
  STATES_LAYER_ID,
  STATES_PUMAS_SOURCE_ID,
  STATES_SOURCE_LAYER,
} from "./constants";
import { Area, LanguageCode, LANGUAGES, LanguageCountsEntries } from "./data";
import {
  buildExploreItems,
  buildLegendItems,
  formatTooltip,
  isMobile,
  isStateLevel,
  topNLanguages,
} from "./helpers";

const defaultLanguage = "1200";
let languageCode: LanguageCode = defaultLanguage;

let topLanguageCounts: LanguageCountsEntries | undefined;

const TOP_N = 5;

const map = new Map({
  container: "map",
  // esbuild fills this in at build time using the env var of the same name
  // @ts-expect-error
  style: BASEMAP_STYLE,
  center: [-103, 44],
  zoom: 3,
});

// Initialize language select
const languageSelectElem = document.getElementById("language");
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
  option.selected = code === defaultLanguage;
  option.innerHTML = label;
  languageSelectElem.appendChild(option);
});
languageSelectElem.addEventListener("change", () => {
  // @ts-ignore
  languageCode = languageSelectElem.value;
  map.setPaintProperty(STATES_LAYER_ID, "fill-color", fillColor(languageCode));
  map.setPaintProperty(PUMAS_LAYER_ID, "fill-color", fillColor(languageCode));
  currentLanguageElem.innerHTML = LANGUAGES[languageCode];
});
// Initialize current language display (for mobile)
currentLanguageElem.innerHTML = LANGUAGES[defaultLanguage];

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
if (!legendItemsContainerElem) {
  throw new Error("missing explore items container element");
}
const updateExploreItems = () => {
  if (exploreItemsContainerElem && topLanguageCounts) {
    const exploreItems = buildExploreItems(topLanguageCounts);
    exploreItemsContainerElem.innerHTML = exploreItems;
  }
};

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
      // @ts-expect-error
      "fill-color": fillColor(languageCode),
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
        // @ts-expect-error
        "fill-color": fillColor(languageCode),
        "fill-opacity": LAYER_OPACITY,
      },
    },
    // States need to show on top of PUMAS layer so they are clickable
    PUMAS_LAYER_ID
  );

  map.on("data", (e) => {
    if (!map.isSourceLoaded(STATES_PUMAS_SOURCE_ID)) return;
    // @ts-expect-error
    const features = map.querySourceFeatures(STATES_PUMAS_SOURCE_ID, {
      sourceLayer: isStateLevel(map) ? STATES_SOURCE_LAYER : PUMAS_SOURCE_LAYER,
    });
    topLanguageCounts = topNLanguages(
      // @ts-expect-error
      features.map((feature) => feature.properties),
      TOP_N
    );
    updateExploreItems();
  });

  function showTooltip(e: MapLayerMouseEvent) {
    const area =
      "features" in e && e.features && (e.features[0].properties as Area);
    if (area) {
      new Popup()
        .setLngLat(e.lngLat)
        .setHTML(formatTooltip(area, languageCode))
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
