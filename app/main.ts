import { Map } from "maplibre-gl";

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
    id: "states",
    type: "line",
    source: "states-pumas",
    "source-layer": "tl_2020_us_state_updated",
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
    id: "pa",
    type: "line",
    source: "states-pumas",
    "source-layer": "tl_2020_42_puma20_updated",
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
});
