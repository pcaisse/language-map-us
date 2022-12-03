import _ from "lodash";
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

// TODO: Add PUMA outline layer to map
export const PUMA_OUTLINE_STYLE = {
  color: "#fff",
  weight: 1,
  dashArray: 5,
  opacity: 0.5,
  fill: false,
};

export const STATES_PUMAS_SOURCE_ID = "states-pumas";
export const STATES_LAYER_ID = "states-layer";
export const PUMAS_LAYER_ID = "pumas-layer";
export const STATES_SOURCE_LAYER = "states";
export const PUMAS_SOURCE_LAYER = "pumas";
