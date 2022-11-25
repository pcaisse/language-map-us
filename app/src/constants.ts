import _ from "lodash";

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

export const DEFAULT_LAYER_STYLE = {
  color: "#ccc",
  fillColor: COLORS[0],
  weight: 1,
  fillOpacity: LAYER_OPACITY,
};

export const PUMA_OUTLINE_STYLE = {
  color: "#fff",
  weight: 1,
  dashArray: 5,
  opacity: 0.5,
  fill: false,
};

export const TOOLTIP_PROPERTIES = {
  permanent: false,
  direction: "auto",
  sticky: true,
};
