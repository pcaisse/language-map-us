import _ from "lodash";
import { LanguageCode } from "./data";

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

const percentage = (languageCode: LanguageCode) => [
  "/",
  ["number", ["get", languageCode], 0], // fall back to zero if language not spoken in area
  ["get", "total"],
];
const betweenPercentages = (languageCode: LanguageCode, index: number) => [
  "all",
  [">=", percentage(languageCode), MAX_PERCENTAGES[index]],
  ["<", percentage(languageCode), MAX_PERCENTAGES[index + 1]],
];

export const fillColor = (languageCode: LanguageCode) => [
  "case",
  ["<", percentage(languageCode), MAX_PERCENTAGES[0]],
  COLORS[0],
  betweenPercentages(languageCode, 1),
  COLORS[1],
  betweenPercentages(languageCode, 2),
  COLORS[2],
  betweenPercentages(languageCode, 3),
  COLORS[3],
  betweenPercentages(languageCode, 4),
  COLORS[4],
  betweenPercentages(languageCode, 5),
  COLORS[5],
  COLORS[6],
];

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
