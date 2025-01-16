import _ from "lodash";
import { LngLatBounds } from "maplibre-gl";

// Color buckets from light blue to dark purple
// NOTE: Colors/percentages are from lowest to highest
export const COLORS = [
  "#edf8fb",
  "#bfd3e6",
  "#9ebcda",
  "#8c96c6",
  "#8c6bb1",
  "#88419d",
  "#6e016b",
] as const;
export const PERCENTAGES = [
  0.000001, 0.00001, 0.0001, 0.001, 0.01, 0.1,
] as const;
export const MAX_PERCENTAGES = [...PERCENTAGES, 1] as const;
export const MIN_PERCENTAGES = [0, ...PERCENTAGES] as const;

// Color buckets from blue to red representing percentage *change* over time
export const COLORS_CHANGE = [
  "#4575b4",
  "#91bfdb",
  "#e0f3f8",
  "#ffffbf",
  "#fee090",
  "#fc8d59",
  "#d73027",
] as const;
export const PERCENTAGES_CHANGE = [0.5, 0.7, 0.9, 1.1, 1.3, 1.5] as const;
export const MAX_PERCENTAGES_CHANGE = [
  ...PERCENTAGES_CHANGE,
  Infinity,
] as const;
export const MIN_PERCENTAGES_CHANGE = [0, ...PERCENTAGES_CHANGE] as const;

export const LAYER_OPACITY = 0.8;

export const STATES_PUMAS_SOURCE_ID = "states-pumas";
export const STATES_LAYER_ID = "states-layer";
export const STATES_OUTLINE_LAYER_ID = "states-outline-layer";
export const PUMAS_LAYER_ID = "pumas-layer";
export const PUMAS_OUTLINE_LAYER_ID = "pumas-outline-layer";
export const STATES_SOURCE_LAYER = "states";
export const PUMAS_SOURCE_LAYER = "pumas";

export const PUMAS_MIN_ZOOM_LEVEL = 7;

export const ZOOM_INFO_WAS_CLOSED_ID = "zoom-info-was-closed";

// Spanish
export const DEFAULT_LANGUAGE_CODE = "1200";

export const DEFAULT_BOUNDS: LngLatBounds = new LngLatBounds(
  {
    lng: -166.1494140625007,
    lat: 14.14626137409661,
  },
  {
    lng: -39.85058593750213,
    lat: 63.96105841348822,
  }
);

export const TOP_N = 10;

// Pre-2016 languages
export const LANGUAGES_OLD = {
  "601": "Jamaican Creole",
  "602": "Krio",
  "607": "German",
  "608": "Pennsylvania Dutch",
  "609": "Yiddish",
  "610": "Dutch",
  "611": "Afrikaans",
  "614": "Swedish",
  "615": "Danish",
  "616": "Norwegian",
  "619": "Italian",
  "620": "French",
  "622": "Patois",
  "623": "French Creole",
  "624": "Cajun",
  "625": "Spanish",
  "629": "Portuguese",
  "631": "Romanian",
  "635": "Irish Gaelic",
  "637": "Greek",
  "638": "Albanian",
  "639": "Russian",
  "641": "Ukrainian",
  "642": "Czech",
  "645": "Polish",
  "646": "Slovak",
  "647": "Bulgarian",
  "648": "Macedonian",
  "649": "Serbo-Croatian",
  "650": "Croatian",
  "651": "Serbian",
  "653": "Lithuanian",
  "654": "Latvian",
  "655": "Armenian",
  "656": "Persian",
  "657": "Pashto",
  "658": "Kurdish",
  "662": "India N.E.C.",
  "663": "Hindi",
  "664": "Bengali",
  "665": "Panjabi",
  "666": "Marathi",
  "667": "Gujarati",
  "671": "Urdu",
  "674": "Nepali",
  "675": "Sindhi",
  "676": "Pakistan N.E.C.",
  "677": "Sinhalese",
  "679": "Finnish",
  "682": "Hungarian",
  "689": "Uighur",
  "691": "Turkish",
  "694": "Mongolian",
  "701": "Telugu",
  "702": "Kannada",
  "703": "Malayalam",
  "704": "Tamil",
  "708": "Chinese",
  "711": "Cantonese",
  "712": "Mandarin",
  "714": "Formosan",
  "717": "Burmese",
  "720": "Thai",
  "721": "Mien",
  "722": "Hmong",
  "723": "Japanese",
  "724": "Korean",
  "725": "Laotian",
  "726": "Mon-Khmer, Cambodian",
  "728": "Vietnamese",
  "732": "Indonesian",
  "739": "Malay",
  "742": "Tagalog",
  "743": "Bisayan",
  "744": "Sebuano",
  "746": "Ilocano",
  "750": "Micronesian",
  "752": "Chamorro",
  "761": "Trukese",
  "767": "Samoan",
  "768": "Tongan",
  "776": "Hawaiian",
  "777": "Arabic",
  "778": "Hebrew",
  "779": "Syriac",
  "780": "Amharic",
  "783": "Cushite",
  "791": "Swahili",
  "792": "Bantu",
  "793": "Mande",
  "794": "Fulani",
  "796": "Kru, Ibo, Yoruba",
  "799": "African",
  "806": "Other Algonquian languages",
  "819": "Ojibwa",
  "862": "Apache",
  "864": "Navajo",
  "907": "Dakota",
  "924": "Keres",
  "933": "Cherokee",
  "964": "Zuni",
  "985": "Other Indo-European languages",
  "986": "Other Asian languages",
  "988": "Other Pacific Island languages",
  "989": "Other specified African languages",
  "990": "Aleut-Eskimo languages",
  "992": "South/Central American Indian languages",
  "993": "Other Specified North American Indian languages",
  "994": "Other languages",
} as const;

// Keys are language codes used in PUMS data.
// These specific codes were first used starting in 2016, so pre-2016 codes
// will not match. Categories were "updated and expanded" starting that year, so
// there is not a 1 to 1 correspondence with previous years' codes.
// See: https://www2.census.gov/programs-surveys/acs/tech_docs/pums/ACS2016_PUMS_README.pdf
export const LANGUAGES_NEW = {
  "1000": "Jamaican Creole English",
  "1025": "Other English-based Creole languages",
  "1055": "Haitian",
  "1069": "Kabuverdianu",
  "1110": "German",
  "1120": "Swiss German",
  "1125": "Pennsylvania German",
  "1130": "Yiddish",
  "1132": "Dutch",
  "1134": "Afrikaans",
  "1140": "Swedish",
  "1141": "Danish",
  "1142": "Norwegian",
  "1155": "Italian",
  "1170": "French",
  "1175": "Cajun French",
  "1200": "Spanish",
  "1210": "Portuguese",
  "1220": "Romanian",
  "1231": "Irish",
  "1235": "Greek",
  "1242": "Albanian",
  "1250": "Russian",
  "1260": "Ukrainian",
  "1262": "Czech",
  "1263": "Slovak",
  "1270": "Polish",
  "1273": "Bulgarian",
  "1274": "Macedonian",
  "1275": "Serbocroatian",
  "1276": "Bosnian",
  "1277": "Croatian",
  "1278": "Serbian",
  "1281": "Lithuanian",
  "1283": "Latvian",
  "1288": "Armenian",
  "1290": "Farsi",
  "1292": "Dari",
  "1315": "Kurdish",
  "1327": "Pashto",
  "1340": "India N.E.C.",
  "1350": "Hindi",
  "1360": "Urdu",
  "1380": "Bengali",
  "1420": "Punjabi",
  "1435": "Konkani",
  "1440": "Marathi",
  "1450": "Gujarati",
  "1500": "Nepali",
  "1525": "Pakistan N.E.C.",
  "1530": "Sinhala",
  "1540": "Other Indo-Iranian languages",
  "1564": "Other Indo-European languages",
  "1565": "Finnish",
  "1582": "Hungarian",
  "1675": "Turkish",
  "1690": "Mongolian",
  "1730": "Telugu",
  "1737": "Kannada",
  "1750": "Malayalam",
  "1765": "Tamil",
  "1900": "Khmer",
  "1960": "Vietnamese",
  "1970": "Chinese",
  "2000": "Mandarin",
  "2030": "Min Nan Chinese",
  "2050": "Cantonese",
  "2100": "Tibetan",
  "2160": "Burmese",
  "2270": "Chin languages",
  "2350": "Karen languages",
  "2430": "Thai",
  "2475": "Lao",
  "2525": "Iu Mien",
  "2535": "Hmong",
  "2560": "Japanese",
  "2575": "Korean",
  "2715": "Malay",
  "2770": "Indonesian",
  "2850": "Other languages of Asia",
  "2910": "Filipino",
  "2920": "Tagalog",
  "2950": "Cebuano",
  "3150": "Ilocano",
  "3190": "Other Philippine languages",
  "3220": "Chamorro",
  "3270": "Marshallese",
  "3350": "Chuukese",
  "3420": "Samoan",
  "3500": "Tongan",
  "3570": "Hawaiian",
  "3600": "Other Eastern Malayo-Polynesian languages",
  "4500": "Arabic",
  "4545": "Hebrew",
  "4560": "Assyrian Neo-Aramaic",
  "4565": "Chaldean Neo-Aramaic",
  "4590": "Amharic",
  "4640": "Tigrinya",
  "4830": "Oromo",
  "4840": "Somali",
  "4880": "Other Afro-Asiatic languages",
  "4900": "Nilo-Saharan languages",
  "5150": "Swahili",
  "5345": "Ganda",
  "5525": "Shona",
  "5645": "Other Bantu languages",
  "5845": "Manding languages",
  "5900": "Other Mande languages",
  "5940": "Fulah",
  "5950": "Wolof",
  "6120": "Akan (incl. Twi)",
  "6205": "Ga",
  "6230": "Gbe languages",
  "6290": "Yoruba",
  "6300": "Edoid languages",
  "6370": "Igbo",
  "6500": "Other Niger-Congo languages",
  "6795": "Other languages of Africa",
  "6800": "Aleut languages",
  "6839": "Ojibwa",
  "6930": "Apache languages",
  "6933": "Navajo",
  "6936": "Kiowa-Tanoan languages",
  "7019": "Dakota languages",
  "7032": "Muskogean languages",
  "7039": "Keres",
  "7050": "Cherokee",
  "7059": "Zuni",
  "7060": "Uto-Aztecan languages",
  "7124": "Other Native North American languages",
  "7300": "Other Central and South American languages",
  "9999": "Other and unspecified languages",
} as const;

// Mapping of pre-2016 language codes to 2016-and-later language codes.
// NOTE: this mapping was done based on common language name/label.
export const languagesOldToNew: Partial<
  Record<keyof typeof LANGUAGES_OLD, keyof typeof LANGUAGES_NEW>
> = {
  "607": "1110",
  "609": "1130",
  "610": "1132",
  "611": "1134",
  "614": "1140",
  "615": "1141",
  "616": "1142",
  "619": "1155",
  "620": "1170",
  "625": "1200",
  "629": "1210",
  "631": "1220",
  "637": "1235",
  "638": "1242",
  "639": "1250",
  "641": "1260",
  "642": "1262",
  "645": "1270",
  "646": "1263",
  "647": "1273",
  "648": "1274",
  "650": "1277",
  "651": "1278",
  "653": "1281",
  "654": "1283",
  "655": "1288",
  "657": "1327",
  "658": "1315",
  "662": "1340",
  "663": "1350",
  "664": "1380",
  "666": "1440",
  "667": "1450",
  "671": "1360",
  "674": "1500",
  "676": "1525",
  "679": "1565",
  "682": "1582",
  "691": "1675",
  "694": "1690",
  "701": "1730",
  "702": "1737",
  "703": "1750",
  "704": "1765",
  "708": "1970",
  "711": "2050",
  "712": "2000",
  "717": "2160",
  "720": "2430",
  "722": "2535",
  "723": "2560",
  "724": "2575",
  "728": "1960",
  "732": "2770",
  "739": "2715",
  "742": "2920",
  "746": "3150",
  "752": "3220",
  "767": "3420",
  "768": "3500",
  "776": "3570",
  "777": "4500",
  "778": "4545",
  "780": "4590",
  "791": "5150",
  "819": "6839",
  "864": "6933",
  "924": "7039",
  "933": "7050",
  "964": "7059",
  "985": "1564",
};

export const languagesNewToOld: Partial<
  Record<keyof typeof LANGUAGES_NEW, keyof typeof LANGUAGES_OLD>
> = _.invert(languagesOldToNew);

// Not all languages can be successfully mapped one-to-one over the 2015->2016
// threshold, so when comparing between years that cross this threshold we
// limit languages to only the common ones.
export const commonLanguages = _.pickBy(LANGUAGES_OLD, (_value, key) => {
  return key in languagesOldToNew;
});

export const LANGUAGES = { ...LANGUAGES_OLD, ...LANGUAGES_NEW };

export const LANGUAGES_BY_SET = {
  old: LANGUAGES_OLD,
  new: LANGUAGES_NEW,
  common: commonLanguages,
} as const;

export const YEARS_ASC = [
  2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019,
] as const;

// The language options provided for the ACS changed in 2016 so not all
// languages are directly comparable after that year.
// See: https://www.census.gov/content/dam/Census/programs-surveys/acs/tech-doc/user-notes/2016_Language_User_Note.pdf
export const NEW_LANGUAGES_YEAR = 2016;
