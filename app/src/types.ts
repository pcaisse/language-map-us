import { LngLatBounds } from "maplibre-gl";
import { LANGUAGES, YEARS } from "./constants";

export type LanguageCode = keyof typeof LANGUAGES;

export type SingleLanguageCounts = Partial<{
  [Key in LanguageCode]: number;
}>;

export type YearLanguageCode = `${Year}-${LanguageCode}`;
export type YearTotal = `${Year}-total`;

export type YearLanguageCounts = Partial<{
  [Key in YearLanguageCode]: number;
}>;

export const otherAreaKeys = ["geoid", "name"] as const;
export type OtherAreaKeys = typeof otherAreaKeys[number];

export type OtherAreaMetadata = {
  [Key in OtherAreaKeys]: string;
};

export type LanguageCounts = Partial<{
  [Key in LanguageCode]: number;
}>;

// Metadata for a PUMA or state
export type Area = YearLanguageCounts & {
  [Key in YearTotal]: number;
} & OtherAreaMetadata;

export type LanguageCountsEntries = [LanguageCode, number][];

export type Year = typeof YEARS[number];
export type YearRange = [Year, Year];

export interface Filters {
  languageCode: LanguageCode;
  year: Year | YearRange;
}

export type MapState = {
  boundingBox: LngLatBounds;
};
export type FilterState = {
  filters: Filters;
};
export type AppState = MapState & FilterState;
