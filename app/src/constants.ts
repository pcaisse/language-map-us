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

export const LAYER_OPACITY = 0.8;

export const STATES_PUMAS_SOURCE_ID = "states-pumas";
export const STATES_LAYER_ID = "states-layer";
export const PUMAS_LAYER_ID = "pumas-layer";
export const STATES_SOURCE_LAYER = "states";
export const PUMAS_SOURCE_LAYER = "pumas";

export const PUMAS_MIN_ZOOM_LEVEL = 7;

export const DEFAULT_LANGUAGE = "1200";
export const DEFAULT_YEAR = 2019;
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

// Keys are language codes used in PUMS data.
// These specific codes were first used starting in 2016, so pre-2016 codes
// will not match. Categories were "updated and expanded" starting that year, so
// there is not a 1 to 1 correspondence with previous years' codes.
// See: https://www2.census.gov/programs-surveys/acs/tech_docs/pums/ACS2016_PUMS_README.pdf
export const LANGUAGES = {
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

export const YEARS = [2016, 2017, 2018, 2019] as const;
