import _ from "lodash";
import {
  COLORS,
  COLORS_CHANGE,
  LANGUAGES,
  LAYER_OPACITY,
  MAX_PERCENTAGES,
  MAX_PERCENTAGES_CHANGE,
  MIN_PERCENTAGES,
  MIN_PERCENTAGES_CHANGE,
  YEARS_ASC,
} from "./constants";
import {
  validYears,
  formatLegendPercentage,
  formatSpeakersPercentage,
  speakerCountsKey,
  totalCountsKey,
} from "./helpers";
import {
  Area,
  LanguageCountsEntries,
  Filters,
  Year,
  LanguageCode,
  YearRange,
} from "./types";

export function formatTooltip(
  area: Area,
  { year, languageCode }: Filters,
  isState: boolean
): string {
  const counts = (year: Year) => {
    const speakerCount = area[speakerCountsKey(year, languageCode)] || 0;
    const totalCount = area[totalCountsKey(year)];
    return { year, speakerCount, totalCount };
  };
  const isSingleYear = typeof year === "number";
  return `
      <div class="area-name">${area.name.replaceAll("--", " — ")}</div>
      ${(isSingleYear ? [year] : year)
        .map(counts)
        .map(
          ({ year, speakerCount, totalCount }) =>
            `
          ${isSingleYear ? "" : `<span class="year">${year}</span>`}
            <div class="area-speakers">
        <span class="area-speakers-label">Speakers:</span>
        <span class="area-speakers-count">${speakerCount.toLocaleString()}</span>
      </div>
      <div class="area-percentage">
        <span class="area-percentage-label">Percentage:</span>
        <span class="area-percentage-count">${formatSpeakersPercentage(
          speakerCount / totalCount,
          1
        )}</span>
      </div>`
        )
        .join("")}
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

export function buildChangeLegend(): string {
  const legendItems = _.zip(
    COLORS_CHANGE,
    MIN_PERCENTAGES_CHANGE,
    MAX_PERCENTAGES_CHANGE
  ).map(([color, minPercentage, maxPercentage]) => {
    if (
      typeof color !== "string" ||
      typeof minPercentage !== "number" ||
      typeof maxPercentage !== "number"
    ) {
      return "";
    }
    const maxPercentageIncrease = maxPercentage - 1;
    const minPercentageIncrease = minPercentage - 1;
    const displayValue =
      minPercentage === 0
        ? formatLegendPercentage(maxPercentageIncrease) + "+"
        : maxPercentage === Infinity
        ? formatLegendPercentage(minPercentageIncrease) + "+"
        : `${formatLegendPercentage(
            minPercentageIncrease
          )} to ${formatLegendPercentage(maxPercentageIncrease)}`;
    return legendItem(color, displayValue);
  });
  return legendContent("Percentage change in speakers", legendItems);
}

export function buildLegend(): string {
  const legendItems = _.zip(COLORS, MIN_PERCENTAGES, MAX_PERCENTAGES).map(
    ([color, minPercentage, maxPercentage]) => {
      return typeof color === "string" &&
        typeof minPercentage === "number" &&
        typeof maxPercentage === "number"
        ? legendItem(
            color,
            `${formatLegendPercentage(
              minPercentage
            )} to ${formatLegendPercentage(maxPercentage)}</span>
      </li>`
          )
        : "";
    }
  );
  return legendContent("Percentage of speakers", legendItems);
}

function legendItem(color: string, displayValue: string) {
  return `<li class="legend__item">
        <div
          class="color-box"
          style="background-color: ${color}; opacity: ${LAYER_OPACITY}">
        </div>
        <span>${displayValue}</span>
      </li>`;
}

function legendContent(title: string, legendItems: string[]) {
  return `<div class="legend__header">
            <h2 class="legend__title">${title}</h2>
            <span id="hide_legend" class="legend__close">&ndash;</span>
          </div>
          <ul id="legend-items" class="legend__list">${legendItems.join(
            ""
          )}</ul>`;
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

export function buildYear({ year, languageCode }: Filters) {
  if (typeof year === "number") {
    return buildYearSelect(
      "year",
      "Year",
      year,
      validYears(year, languageCode)
    );
  }
  const [start, end] = year;
  const valid = validYears(end, languageCode);
  return [
    buildYearSelect("year-start", "Start Year", start, valid),
    buildYearSelect("year-end", "End Year", end, valid),
  ].join("");
}

function buildOption(year: Year, currentYear: Year, disabled: boolean) {
  const yearString = String(currentYear);
  return `
    <option value="${yearString}" ${currentYear === year ? "selected" : ""} ${
    disabled ? "disabled" : ""
  }>${yearString}</option>
    `;
}

function buildYearSelect(
  id: string,
  title: string,
  year: Year,
  validYears: YearRange
) {
  const options = YEARS_ASC.map((currentYear) =>
    buildOption(
      year,
      currentYear,
      currentYear < validYears[0] || currentYear > validYears[1]
    )
  );
  return `
    <label for="${id}" class="form__label">${title}</label>
    <select id="${id}" class="form__input form__select">${options.join(
    ""
  )}</select>
  `;
}

export function buildLanguageOptions(
  languageCode: LanguageCode,
  languageCodeNamesSortedByName: [LanguageCode, string][]
) {
  return languageCodeNamesSortedByName
    .map(
      ([code, name]) => `
      <option value="${code}" ${code === languageCode ? "selected" : ""}>
        ${name}
      </option>
    `
    )
    .join("");
}
