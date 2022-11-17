import Map from "ol/Map";
import MVT from "ol/format/MVT";
import VectorTileLayer from "ol/layer/VectorTile";
import VectorTileSource from "ol/source/VectorTile";
import View from "ol/View";
import { fromLonLat } from "ol/proj";

new Map({
  layers: [
    new VectorTileLayer({
      source: new VectorTileSource({
        attributions:
          "&copy; OpenStreetMap contributors, Who’s On First, " +
          "Natural Earth, and osmdata.openstreetmap.de",
        format: new MVT({
          layerName: "layer",
          layers: [
            "tl_2020_01_puma20_updated",
            "tl_2020_42_puma20_updated",
            "tl_2020_us_state_updated",
          ],
        }),
        maxZoom: 14,
        url: "http://localhost:3000/tiles/{z}/{x}/{y}.pbf",
      }),
    }),
  ],
  target: "map",
  view: new View({
    center: fromLonLat([-74.0064, 40.7142]),
    maxZoom: 14,
    zoom: 7,
  }),
});
