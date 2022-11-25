import { Map, Popup } from "maplibre-gl";
import { Area, LanguageCode, languages } from "./data";
import { buildLegendItems, formatTooltip } from "./helpers";

const defaultLanguage = "1200";
let language: LanguageCode = defaultLanguage;

const map = new Map({
  container: "map",
  // esbuild fills this in at build time using the env var of the same name
  // @ts-expect-error
  style: BASEMAP_STYLE,
  center: [-75, 40],
  zoom: 7,
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
  language = languageSelectElem.value;
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

map.on("load", function () {
  map.addSource("states-pumas", {
    type: "vector",
    tiles: ["http://localhost:3000/tiles/{z}/{x}/{y}.pbf"],
    maxzoom: 14,
  });
  // states
  map.addLayer({
    id: "states-layer",
    type: "line",
    source: "states-pumas",
    "source-layer": "states",
    layout: {
      "line-cap": "round",
      "line-join": "round",
    },
    paint: {
      "line-opacity": 0.6,
      "line-color": "rgb(53, 175, 109)",
      "line-width": 2,
    },
  });
  // pumas
  map.addLayer({
    id: "pumas-layer",
    type: "fill",
    source: "states-pumas",
    "source-layer": "pumas",
    paint: {
      "fill-color": "rgba(200, 100, 240, 0.4)",
      "fill-outline-color": "rgba(200, 100, 240, 1)",
    },
  });

  map.on("click", "pumas-layer", function (e) {
    // @ts-ignore
    const area: Area =
      "features" in e && e.features && e.features[0].properties;
    new Popup()
      .setLngLat(e.lngLat)
      .setHTML(formatTooltip(area, language))
      .addTo(map);
  });

  map.on("mouseenter", "pumas-layer", function () {
    map.getCanvas().style.cursor = "pointer";
  });

  map.on("mouseleave", "pumas-layer", function () {
    map.getCanvas().style.cursor = "";
  });
});
