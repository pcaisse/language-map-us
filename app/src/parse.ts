import { LngLatBounds } from "maplibre-gl";
import { parse } from "qs";
import {
  DEFAULT_BOUNDS,
  DEFAULT_LANGUAGE_CODE,
  LANGUAGES,
  YEARS,
  YEARS_ASC,
} from "./constants";
import { AppState, LanguageCode, Year, YearRange } from "./types";

export function parseLanguageCode(s: string): LanguageCode | undefined {
  const languageCodes = Object.keys(LANGUAGES) as Array<LanguageCode>;
  return languageCodes.find((languageCode) => languageCode === s);
}

export function parseLanguageCodeUnsafe(s: string): LanguageCode {
  const maybeLanguageCode = parseLanguageCode(s);
  if (!maybeLanguageCode) {
    throw new Error(`Invalid value for language code: ${s}`);
  }
  return maybeLanguageCode;
}

export function parseSingleYear(s: string): Year | undefined {
  return YEARS.find((year) => year === parseInt(s, 10));
}

export function parseSingleYearUnsafe(s: string): Year {
  const maybeYear = parseSingleYear(s);
  if (!maybeYear) {
    throw new Error(`Invalid value for single year: ${s}`);
  }
  return maybeYear;
}

export function parseYear(s: string): Year | YearRange | undefined {
  const years = s.split(",").map(parseSingleYear);
  const [yearStart, yearEnd] = years;
  if (yearStart && yearEnd && yearStart < yearEnd) {
    return [yearStart, yearEnd];
  } else {
    return yearStart;
  }
}

export function parseYearUnsafe(s: string): Year | YearRange {
  const maybeYear = parseYear(s);
  if (!maybeYear) {
    throw new Error(`Invalid value for year: ${s}`);
  }
  return maybeYear;
}

export function parseBoundingBox(s: string): LngLatBounds | undefined {
  const xs = s.split(",").map(parseFloat);
  if (xs.length !== 4 || xs.some((x) => Number.isNaN(x))) return undefined;
  return new LngLatBounds([xs[0], xs[1]], [xs[2], xs[3]]);
}

export function parseQueryString(queryString: string): AppState {
  const { languageCode, year, boundingBox } = parse(queryString, {
    ignoreQueryPrefix: true,
  });
  return {
    filters: {
      languageCode:
        (typeof languageCode === "string" && parseLanguageCode(languageCode)) ||
        DEFAULT_LANGUAGE_CODE,
      year:
        (typeof year === "string" && parseYear(year)) ||
        YEARS_ASC[YEARS_ASC.length - 1],
    },
    boundingBox:
      (typeof boundingBox === "string" && parseBoundingBox(boundingBox)) ||
      DEFAULT_BOUNDS,
  };
}
