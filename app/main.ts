import { Map, Popup } from "maplibre-gl";

const map = new Map({
  container: "map",
  style: "https://demotiles.maplibre.org/style.json",
  center: [-75, 40],
  zoom: 7,
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
    new Popup()
      .setLngLat(e.lngLat)
      // @ts-ignore
      .setHTML(JSON.stringify(e.features[0].properties))
      .addTo(map);
  });

  map.on("mouseenter", "pumas-layer", function () {
    map.getCanvas().style.cursor = "pointer";
  });

  map.on("mouseleave", "pumas-layer", function () {
    map.getCanvas().style.cursor = "";
  });
});
