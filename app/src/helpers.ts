import _ from "lodash";
import {
  COLORS,
  LAYER_OPACITY,
  MAX_PERCENTAGES,
  MIN_PERCENTAGES,
} from "./constants";
import { Area, LanguageCode } from "./data";

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

export function buildLegendItems() {
  return _.zip(COLORS, MIN_PERCENTAGES, MAX_PERCENTAGES).map(
    ([color, minPercentage, maxPercentage]) => {
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
    }
  );
}
