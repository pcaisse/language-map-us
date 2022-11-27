import _ from "lodash";
import { Map, MapGeoJSONFeature } from "maplibre-gl";
import {
  COLORS,
  LAYER_OPACITY,
  MAX_PERCENTAGES,
  MIN_PERCENTAGES,
} from "./constants";
import {
  Area,
  LanguageCode,
  LanguageCounts,
  LANGUAGES,
  LanguageCountsEntries,
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

export function formatTooltip(area: Area, languageCode: LanguageCode) {
  const languageCount = area[languageCode] || 0;
  const totalCount = area["total"];
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

const onlyCounts = (area: Area) =>
  _.omit(area, ["geoid", "name", "total"]) as LanguageCounts;

const sortByCount = (languageCounts: LanguageCounts) =>
  _.orderBy(Object.entries(languageCounts), ([, value]) => value, [
    "desc",
  ]) as LanguageCountsEntries;

export function topNLanguages(
  areaProperties: Area[],
  n: number
): LanguageCountsEntries {
  const emptyLanguageCounts: LanguageCounts = _.mapValues(LANGUAGES, () => 0);
  const languageCounts = areaProperties
    .map(onlyCounts)
    .filter((languageCounts) => Object.keys(languageCounts).length > 0);
  const aggAreaProperties = languageCounts.reduce(
    (counts: LanguageCounts, properties: LanguageCounts) => {
      return _.mergeWith(counts, properties, _.add);
    },
    emptyLanguageCounts
  );
  return sortByCount(aggAreaProperties).slice(0, n);
}
