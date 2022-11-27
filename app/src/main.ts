import { Map, Popup } from "maplibre-gl";
import {
  fillColor,
  PUMAS_LAYER_ID,
  PUMAS_SOURCE_LAYER,
  STATES_LAYER_ID,
  STATES_PUMAS_SOURCE_ID,
  STATES_SOURCE_LAYER,
} from "./constants";
import { Area, LanguageCode, languages } from "./data";
import { buildLegendItems, formatTooltip } from "./helpers";

const defaultLanguage = "1200";
let languageCode: LanguageCode = defaultLanguage;

let isExploreMode = false;

const map = new Map({
  container: "map",
  // esbuild fills this in at build time using the env var of the same name
  // @ts-expect-error
  style: BASEMAP_STYLE,
  center: [-103, 44],
  zoom: 2,
});

// Initialize language select
const languageSelectElem = document.getElementById("language");
if (!languageSelectElem) {
  throw new Error("missing language select element");
}
Object.entries(languages).forEach(([code, label]) => {
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
});

// Build legend
const legendItems = buildLegendItems();
const legendItemsContainerElem = document.getElementById("legend-items");
if (!legendItemsContainerElem) {
  throw new Error("missing legend items container element");
}
legendItems.forEach((legendItem) => {
  legendItemsContainerElem.insertAdjacentHTML("beforeend", legendItem);
});

// Wire up explore mode button
const exploreButtonElem = document.getElementById("explore");
if (!exploreButtonElem) {
  throw new Error("missing explore button element");
}
const legendElem = document.getElementById("legend");
if (!legendElem) {
  throw new Error("missing legend element");
}
const legendExploreElem = document.getElementById("legend-explore");
if (!legendExploreElem) {
  throw new Error("missing legend explore element");
}
const showHideLegends = () => {
  legendElem.style.visibility = isExploreMode ? "hidden" : "visible";
  legendExploreElem.style.visibility = isExploreMode ? "visible" : "hidden";
};
exploreButtonElem.addEventListener("click", () => {
  isExploreMode = !isExploreMode;
  showHideLegends();
});
showHideLegends();

map.on("load", function () {
  map.addSource(STATES_PUMAS_SOURCE_ID, {
    type: "vector",
    tiles: ["http://localhost:3000/tiles/{z}/{x}/{y}.pbf"],
    maxzoom: 14,
  });
  // states
  map.addLayer({
    id: STATES_LAYER_ID,
    source: STATES_PUMAS_SOURCE_ID,
    "source-layer": STATES_SOURCE_LAYER,
    type: "fill",
    paint: {
      // @ts-expect-error
      "fill-color": fillColor(languageCode),
      "fill-opacity": 0.8,
    },
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
      "fill-opacity": 0.8,
    },
  });
  map.on("click", PUMAS_LAYER_ID, function (e) {
    const area =
      "features" in e && e.features && (e.features[0].properties as Area);
    if (area) {
      new Popup()
        .setLngLat(e.lngLat)
        .setHTML(formatTooltip(area, languageCode))
        .addTo(map);
    }
  });

  map.on("mouseenter", PUMAS_LAYER_ID, function () {
    map.getCanvas().style.cursor = "pointer";
  });

  map.on("mouseleave", PUMAS_LAYER_ID, function () {
    map.getCanvas().style.cursor = "";
  });
});
