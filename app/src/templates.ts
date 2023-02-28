import _ from "lodash";
import {
  COLORS,
  LANGUAGES,
  LAYER_OPACITY,
  MAX_PERCENTAGES,
  MIN_PERCENTAGES,
} from "./constants";
import {
  formatLegendPercentage,
  formatSpeakersPercentage,
  speakerCountsKey,
  totalCountsKey,
} from "./helpers";
import { Area, LanguageCountsEntries, Filters } from "./types";

export function formatTooltip(
  area: Area,
  filters: Filters,
  isState: boolean
): string {
  const languageCount = area[speakerCountsKey(filters)] || 0;
  const totalCount = area[totalCountsKey(filters.year)];
  return `
      <div class="area-name">${area.name.replaceAll("--", " — ")}</div>
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
      ${
        isState
          ? `
      <div>
        <a href="#" class="zoom-to">Explore area</a>
      </div>
      `
          : ""
      }
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
      <li class="explore-language" title="${count.toLocaleString()} speakers">
        <a href="#" data-language-code="${languageCode}">${
          LANGUAGES[languageCode]
        }</a>
      </li>
    `
    )
    .join("");
}
