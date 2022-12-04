import _ from "lodash";
import { LngLatBounds } from "maplibre-gl";
import { Filters, YearLanguageCode, Year, YearTotal } from "./data";

// Color buckets from light blue to dark purple
// NOTE: Colors/percentages are from lowest to highest
export const COLORS = [
  "#edf8fb",
  "#bfd3e6",
  "#9ebcda",
  "#8c96c6",
  "#8c6bb1",
  "#88419d",
  "#6e016b",
];
export const MAX_PERCENTAGES = (() => {
  return COLORS.map((_, index) => 1 / 10 ** index).reverse();
})();
export const MIN_PERCENTAGES = [null, ..._.dropRight(MAX_PERCENTAGES)];

export const LAYER_OPACITY = 0.8;

export const STATES_PUMAS_SOURCE_ID = "states-pumas";
export const STATES_LAYER_ID = "states-layer";
export const PUMAS_LAYER_ID = "pumas-layer";
export const STATES_SOURCE_LAYER = "states";
export const PUMAS_SOURCE_LAYER = "pumas";

export const DEFAULT_LANGUAGE = "1200";
export const DEFAULT_YEAR = "2019";
export const DEFAULT_BOUNDS: LngLatBounds = new LngLatBounds(
  {
    lng: -166.1494140625007,
    lat: 14.14626137409661,
  },
  {
    lng: -39.85058593750213,
    lat: 63.96105841348822,
  }
);

export const TOP_N = 5;
