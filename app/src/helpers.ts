import _ from "lodash";
import { Map } from "maplibre-gl";
import {
  COLORS,
  COLORS_CHANGE,
  LANGUAGES,
  PERCENTAGES,
  PERCENTAGES_CHANGE,
} from "./constants";
import {
  Area,
  LanguageCountsEntries,
  Filters,
  LanguageCounts,
  YearLanguageCode,
  Year,
  YearTotal,
  YearLanguageCounts,
  LanguageCode,
  YearRange,
} from "./types";

export function legendFractionDigits(percentage: number) {
  if (percentage === 0) return 0;
  const numberLog = Math.log10(percentage * 100);
  return numberLog < 0 ? Math.floor(Math.abs(numberLog)) : 0;
}

export function speakersFractionDigits(
  percentage: number,
  minFractionDigits: number
) {
  if (percentage === 0) return 0;
  const numberLog = Math.log10(percentage * 100);
  return numberLog < 0
    ? Math.floor(Math.abs(numberLog)) + 2
    : minFractionDigits;
}

export function formatLegendPercentage(percentage: number) {
  return formatPercentage(percentage, legendFractionDigits(percentage));
}

export function formatSpeakersPercentage(
  percentage: number,
  minFractionDigits: number
) {
  return formatPercentage(
    percentage,
    speakersFractionDigits(percentage, minFractionDigits)
  );
}

export function formatPercentage(percentage: number, fractionDigits: number) {
  return percentage.toLocaleString(undefined, {
    style: "percent",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

export function isStateLevel(map: Map) {
  return map.getZoom() < 8;
}

export const isMobile = document.documentElement.clientWidth <= 1024;

export const speakerCountsKey = (
  year: Year,
  languageCode: LanguageCode
): YearLanguageCode => `${year}-${languageCode}`;

export const totalCountsKey = (year: Year): YearTotal => `${year}-total`;

const percentage = (year: Year, languageCode: LanguageCode) => [
  "/",
  // language count keys are prefixed with year
  ["number", ["get", speakerCountsKey(year, languageCode)], 0], // fall back to zero if language not spoken in area
  ["get", totalCountsKey(year)],
];

const percentageChange = (
  [start, end]: YearRange,
  languageCode: LanguageCode
) => [
  "to-number",
  [
    "/",
    ["number", ["get", speakerCountsKey(end, languageCode)], 0],
    ["number", ["get", speakerCountsKey(start, languageCode)], 0],
  ],
  1,
];

const betweenPercentages = (
  year: Year,
  languageCode: LanguageCode,
  index: number
) => [
  "all",
  [">=", percentage(year, languageCode), PERCENTAGES[index]],
  ["<", percentage(year, languageCode), PERCENTAGES[index + 1]],
];

const betweenPercentageChanges = (
  year: YearRange,
  languageCode: LanguageCode,
  index: number
) => [
  "all",
  [">=", percentageChange(year, languageCode), PERCENTAGES_CHANGE[index]],
  ["<", percentageChange(year, languageCode), PERCENTAGES_CHANGE[index + 1]],
];

export const fillColor = ({ year, languageCode }: Filters) =>
  typeof year === "number"
    ? [
        "case",
        ["<", percentage(year, languageCode), PERCENTAGES[0]],
        COLORS[0],
        betweenPercentages(year, languageCode, 0),
        COLORS[1],
        betweenPercentages(year, languageCode, 1),
        COLORS[2],
        betweenPercentages(year, languageCode, 2),
        COLORS[3],
        betweenPercentages(year, languageCode, 3),
        COLORS[4],
        betweenPercentages(year, languageCode, 4),
        COLORS[5],
        COLORS[6],
      ]
    : [
        "case",
        ["<", percentageChange(year, languageCode), PERCENTAGES_CHANGE[0]],
        COLORS_CHANGE[0],
        betweenPercentageChanges(year, languageCode, 0),
        COLORS_CHANGE[1],
        betweenPercentageChanges(year, languageCode, 1),
        COLORS_CHANGE[2],
        betweenPercentageChanges(year, languageCode, 2),
        COLORS_CHANGE[3],
        betweenPercentageChanges(year, languageCode, 3),
        COLORS_CHANGE[4],
        betweenPercentageChanges(year, languageCode, 4),
        COLORS_CHANGE[5],
        COLORS_CHANGE[6],
      ];

const sortByCount = (languageCounts: LanguageCounts) =>
  _.orderBy(Object.entries(languageCounts), ([, value]) => value, [
    "desc",
  ]) as LanguageCountsEntries;

const onlyCounts =
  (year: Year) =>
  (area: Area): LanguageCounts => {
    const yearPrefixRegex = new RegExp("^" + year + "-");
    const onlyYearCounts: YearLanguageCounts = _.pickBy(
      area,
      // Only get counts for languages for this year, ignoring speaker count total
      (_, key) => key.startsWith(String(year)) && !key.endsWith("total")
    );
    return _.mapKeys(onlyYearCounts, (_, key) =>
      key.replace(yearPrefixRegex, "")
    );
  };

export function topNLanguages(
  areas: Area[],
  year: Year,
  n: number
): LanguageCountsEntries {
  if (areas.length === 0) {
    return [];
  }
  const emptyLanguageCounts: LanguageCounts = _.mapValues(LANGUAGES, () => 0);
  const languageCounts = areas
    .map(onlyCounts(year))
    .filter((languageCounts) => Object.keys(languageCounts).length > 0);
  const aggAreaProperties = languageCounts.reduce(
    (counts: LanguageCounts, properties: LanguageCounts) => {
      return _.mergeWith(counts, properties, _.add);
    },
    emptyLanguageCounts
  );
  return sortByCount(aggAreaProperties).slice(0, n);
}

export function querySelectorThrows<T extends HTMLElement>(
  selector: string
): T {
  const elem: T | null = document.querySelector(selector);
  if (!elem) {
    throw new Error(`Element not found for selector: ${selector}`);
  }
  return elem;
}
