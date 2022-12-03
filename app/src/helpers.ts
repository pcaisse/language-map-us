import _ from "lodash";
import { Map } from "maplibre-gl";
import {
  COLORS,
  LAYER_OPACITY,
  MAX_PERCENTAGES,
  MIN_PERCENTAGES,
} from "./constants";
import {
  Area,
  LANGUAGES,
  LanguageCountsEntries,
  Filters,
  LanguageCounts,
  YearLanguageCode,
  Year,
  YearTotal,
  otherAreaKeys,
  YearLanguageCounts,
} from "./data";

export function percentageToColor(percentage: number) {
  if (isNaN(percentage)) {
    return COLORS[0];
  }
  for (let i = 0; i < COLORS.length; i++) {
    const currColor = COLORS[i];
    const currPercentage = MAX_PERCENTAGES[i];
    if (percentage <= currPercentage) {
      return currColor;
    }
  }
}

export function legendFractionDigits(percentage: number) {
  if (percentage === null) {
    return 0;
  }
  const numberLog = Math.log10(percentage * 100);
  return numberLog < 0 ? Math.floor(Math.abs(numberLog)) : 0;
}

export function speakersFractionDigits(
  percentage: number,
  minFractionDigits: number
) {
  if (percentage === null) {
    return 0;
  }
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
  return (percentage || 0).toLocaleString(undefined, {
    style: "percent",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

export function formatTooltip(area: Area, filters: Filters) {
  const languageCount = area[speakerCountsKey(filters)] || 0;
  const totalCount = area[totalCountsKey(filters.year)];
  return `
      <div class="area-name">${area.name}</div>
      <div class="area-speakers">
        <span class="area-speakers-label">Speakers:</span>
        <span class="area-speakers-count">${languageCount.toLocaleString()}</span>
      </div>
      <div class="area-percentage">
        <span class="area-percentage-label">Percentage:</span>
        <span class="area-percentage-count">${formatSpeakersPercentage(
          languageCount / totalCount,
          1
        )}</span>
      </div>
    `;
}

export function buildLegendItems(): string {
  return _.zip(COLORS, MIN_PERCENTAGES, MAX_PERCENTAGES)
    .map(([color, minPercentage, maxPercentage]) => {
      return typeof color === "string" &&
        typeof minPercentage === "number" &&
        typeof maxPercentage === "number"
        ? `
      <li class="legend__item">
        <div
          class="color-box"
          style="background-color: ${color}; opacity: ${LAYER_OPACITY}">
        </div>
        <span>${formatLegendPercentage(
          minPercentage
        )} to ${formatLegendPercentage(maxPercentage)}</span>
      </li>
    `
        : "";
    })
    .join("");
}

export function buildExploreItems(languages: LanguageCountsEntries): string {
  return languages
    .map(
      ([languageCode, count]) =>
        `
      <li class="legend__item" title="${count.toLocaleString()} speakers">
        <span>${LANGUAGES[languageCode]}</span>
      </li>
    `
    )
    .join("");
}

export function isStateLevel(map: Map) {
  return map.getZoom() < 8;
}

export const isMobile = document.documentElement.clientWidth <= 1024;

export const speakerCountsKey = ({
  languageCode,
  year,
}: Filters): YearLanguageCode => `${year}-${languageCode}`;

export const totalCountsKey = (year: Year): YearTotal => `${year}-total`;

const percentage = (filters: Filters) => [
  "/",
  // language count keys are prefixed with year
  ["number", ["get", speakerCountsKey(filters)], 0], // fall back to zero if language not spoken in area
  ["get", totalCountsKey(filters.year)],
];

const betweenPercentages = (filters: Filters, index: number) => [
  "all",
  [">=", percentage(filters), MAX_PERCENTAGES[index]],
  ["<", percentage(filters), MAX_PERCENTAGES[index + 1]],
];

export const fillColor = (filters: Filters) => [
  "case",
  ["<", percentage(filters), MAX_PERCENTAGES[0]],
  COLORS[0],
  betweenPercentages(filters, 1),
  COLORS[1],
  betweenPercentages(filters, 2),
  COLORS[2],
  betweenPercentages(filters, 3),
  COLORS[3],
  betweenPercentages(filters, 4),
  COLORS[4],
  betweenPercentages(filters, 5),
  COLORS[5],
  COLORS[6],
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
