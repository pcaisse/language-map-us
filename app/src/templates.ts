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
  TOP_N_IN_TOOLTIP,
  YEARS_ASC,
} from "./constants";
import {
  validYears,
  formatLegendPercentage,
  formatSpeakersPercentage,
  speakerCountsKey,
  totalCountsKey,
  topNLanguages,
} from "./helpers";
import {
  Area,
  LanguageCountsEntries,
  Filters,
  Year,
  LanguageCode,
  YearRange,
} from "./types";

/*
 * Custom formatting for templates.
 *
 * Does auto-joining of arrays and handles nullish values appropriately.
 */
function format(
  strings: TemplateStringsArray,
  ...values: (undefined | null | false | string | number | string[])[]
): string {
  return strings.reduce((output, str) => {
    const nextVal = values.shift();
    const formattedNextVal =
      nextVal === undefined || nextVal === null || nextVal === false
        ? ""
        : typeof nextVal === "object"
        ? nextVal.join("")
        : nextVal;
    return output + str + formattedNextVal;
  }, "");
}

export function buildTooltip(
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
  return format`
      <div class="area-name">${area.name.replaceAll("--", " — ")}</div>
      <div>Language: ${LANGUAGES[languageCode]}</div>
      ${(isSingleYear ? [year] : year).map(counts).map(
        ({ year, speakerCount, totalCount }) =>
          format`
          ${!isSingleYear && `<span class="year">${year}</span>`}
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
      )}
      ${
        isSingleYear &&
        `<div>
        Most spoken languages:
        <ol>${buildExploreItems(
          topNLanguages([area], year, TOP_N_IN_TOOLTIP)
        )}</ol>
      </div>`
      }
      ${
        isState &&
        `
      <div>
        <a href="#" class="zoom-to">Explore area</a>
      </div>
      `
      }
    `;
}

export function buildChangeLegend(): string {
  const legendItems = _.zip(
    COLORS_CHANGE,
    MIN_PERCENTAGES_CHANGE,
    MAX_PERCENTAGES_CHANGE
  )
    .reverse()
    .map(([color, minPercentage, maxPercentage]) => {
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
  const legendItems = _.zip(COLORS, MIN_PERCENTAGES, MAX_PERCENTAGES)
    .reverse()
    .map(([color, minPercentage, maxPercentage]) => {
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
    });
  return legendContent("Percentage of speakers", legendItems);
}

function legendItem(color: string, displayValue: string) {
  return format`<li class="legend__item">
        <div
          class="color-box"
          style="background-color: ${color}; opacity: ${LAYER_OPACITY}">
        </div>
        <span>${displayValue}</span>
      </li>`;
}

function legendContent(title: string, legendItems: string[]) {
  return format`<div class="legend__header">
            <h2 class="legend__title">${title}</h2>
            <span id="hide_legend" class="legend__close">&ndash;</span>
          </div>
          <ul id="legend-items" class="legend__list">${legendItems}</ul>`;
}

export function buildExploreItems(languages: LanguageCountsEntries): string {
  return languages
    .map(
      ([languageCode, count]) =>
        format`
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
  return format`
    <option value="${yearString}" ${currentYear === year && "selected"} ${
    disabled && "disabled"
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
  return format`
    <label for="${id}" class="form__label">${title}</label>
    <select id="${id}" class="form__input form__select">${options}</select>
  `;
}

export function buildLanguageOptions(
  languageCode: LanguageCode,
  languageCodeNamesSortedByName: [LanguageCode, string][]
) {
  return languageCodeNamesSortedByName
    .map(
      ([code, name]) => format`
      <option value="${code}" ${code === languageCode && "selected"}>
        ${name}
      </option>
    `
    )
    .join("");
}

export function buildMobileFilters(filters: Filters) {
  const { languageCode, year } = filters;
  const years = (typeof year === "number" ? [year] : year)
    .map((currentYear) => `<span class="filter-val">${currentYear}</span>`)
    .join(" to ");
  return `
    <span class="filter-val">${LANGUAGES[languageCode]}</span> speakers for ${years}
  `;
}
