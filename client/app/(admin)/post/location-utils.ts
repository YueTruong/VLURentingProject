"use client";

export type LatLng = {
  lat: number;
  lng: number;
};

export type LocationAddressFields = {
  primaryAddress?: string;
  ward?: string;
  district?: string;
  city?: string;
  country?: string;
};

export type LookupContext = "forward" | "reverse";
export type AddressType = "detailed" | "place";

export type LocationLookupIssue =
  | "missing"
  | "not_found"
  | "rate_limited"
  | "service_unavailable"
  | "failed";

export type ForwardGeocodeResult = {
  location: LatLng;
  label: string;
};

export type ReverseGeocodeResult = {
  location: LatLng;
  label: string;
};

type NominatimSearchResult = {
  address?: Record<string, string | undefined>;
  category?: string;
  display_name?: string;
  importance?: number;
  lat?: string | number;
  lon?: string | number;
  name?: string;
  place_rank?: number;
  type?: string;
};

type NominatimReverseResponse = {
  address?: Record<string, string | undefined>;
  display_name?: string;
  lat?: string | number;
  lon?: string | number;
};

type PhotonFeature = {
  geometry?: {
    coordinates?: [number, number];
  };
  properties?: {
    city?: string;
    country?: string;
    countrycode?: string;
    district?: string;
    housenumber?: string;
    locality?: string;
    name?: string;
    osm_key?: string;
    osm_type?: string;
    osm_value?: string;
    state?: string;
    street?: string;
    type?: string;
  };
};

type PhotonResponse = {
  features?: PhotonFeature[];
};

export type NormalizedAddress = {
  administrativeVariants: string[];
  asciiDetailedAddress: string;
  asciiPrimaryAddress: string;
  city: string;
  compactDetailedAddress: string;
  country: string;
  detailedAddress: string;
  district: string;
  districtAliases: string[];
  houseNumber: string;
  originalInput: string;
  placeAddress: string;
  primaryAddress: string;
  shortDetailedAddress: string;
  streetVariants: string[];
  streetName: string;
  type: AddressType;
  ward: string;
  wardAliases: string[];
};

export type GeocodeQueryPlan =
  | {
      kind: "nominatim-text" | "photon";
      label: string;
      query: string;
      stage: "detailed" | "place";
    }
  | {
      kind: "nominatim-structured";
      label: string;
      stage: "detailed" | "place";
      structured: {
        city?: string;
        country?: string;
        county?: string;
        state?: string;
        street?: string;
      };
    };

type GeocodeCandidate = {
  address?: Record<string, string | undefined>;
  category: string;
  importance: number;
  label: string;
  location: LatLng;
  name: string;
  placeRank: number;
  source: "nominatim" | "photon";
  type: string;
};

type AdministrativeNormalization = {
  administrativeVariants: string[];
  city: string;
  country: string;
  district: string;
  districtAliases: string[];
  ward: string;
  wardAliases: string[];
};

type HcmAdministrativeRule = {
  legacyDistrict: string;
  legacyDistrictAliases: string[];
  legacyWards: string[];
  newWard: string;
  newWardAliases: string[];
};

export type ScoredGeocodeResult = {
  candidate: {
    label: string;
    location: LatLng;
    source: "nominatim" | "photon";
    type: string;
    category: string;
  };
  reason: string[];
  score: number;
};

const FETCH_TIMEOUT_MS = 9000;
const DEFAULT_CITY = "Thành phố Hồ Chí Minh";
const DEFAULT_COUNTRY = "Việt Nam";
const DEFAULT_CITY_ENGLISH = "Ho Chi Minh City";
const DEFAULT_COUNTRY_ENGLISH = "Vietnam";
const DETAILED_CONFIDENCE_THRESHOLD = 95;
const PLACE_CONFIDENCE_THRESHOLD = 35;
const HCMC_VIEWBOX = "106.3000,11.2000,107.1500,10.3000";
const PLACE_NAME_KEYWORDS =
  /\b(dai hoc|truong|benh vien|phong kham|cong ty|toa nha|khach san|nha hang|cafe|coffee|vincom|landmark|aeon|gigamall|coopmart|circle k|co so|chi nhanh|building|mall|market|park|cong vien)\b/;
const STREET_HINT_KEYWORDS =
  /\b(duong|street|st|road|rd|hem|hxh|ngo|ngach|alley|lane)\b/;

const RESULT_TYPE_WEIGHTS: Record<string, number> = {
  building: 20,
  house: 28,
  residential: 18,
  road: 12,
  street: 14,
  service: 8,
  path: -8,
  university: -10,
};

const RESULT_CATEGORY_WEIGHTS: Record<string, number> = {
  building: 18,
  highway: 20,
  place: 8,
  amenity: -26,
  leisure: -18,
  office: -18,
  shop: -16,
  tourism: -18,
};

const DISTRICT_ALIAS_MAP: Array<{ canonical: string; variants: string[] }> = [
  { canonical: "Quận 1", variants: ["quan 1", "q1", "q 1", "district 1"] },
  { canonical: "Quận 3", variants: ["quan 3", "q3", "q 3", "district 3"] },
  { canonical: "Quận 4", variants: ["quan 4", "q4", "q 4", "district 4"] },
  { canonical: "Quận 5", variants: ["quan 5", "q5", "q 5", "district 5"] },
  { canonical: "Quận 6", variants: ["quan 6", "q6", "q 6", "district 6"] },
  { canonical: "Quận 7", variants: ["quan 7", "q7", "q 7", "district 7"] },
  { canonical: "Quận 8", variants: ["quan 8", "q8", "q 8", "district 8"] },
  { canonical: "Quận 10", variants: ["quan 10", "q10", "q 10", "district 10"] },
  { canonical: "Quận 11", variants: ["quan 11", "q11", "q 11", "district 11"] },
  { canonical: "Quận 12", variants: ["quan 12", "q12", "q 12", "district 12"] },
  { canonical: "Quận Bình Thạnh", variants: ["quan binh thanh", "q binh thanh", "binh thanh"] },
  { canonical: "Quận Gò Vấp", variants: ["quan go vap", "q go vap", "go vap"] },
  { canonical: "Quận Phú Nhuận", variants: ["quan phu nhuan", "q phu nhuan", "phu nhuan"] },
  { canonical: "Quận Tân Bình", variants: ["quan tan binh", "q tan binh", "tan binh"] },
  { canonical: "Quận Tân Phú", variants: ["quan tan phu", "q tan phu", "tan phu"] },
  { canonical: "Quận Bình Tân", variants: ["quan binh tan", "q binh tan", "binh tan"] },
  { canonical: "Thành phố Thủ Đức", variants: ["thanh pho thu duc", "tp thu duc", "thu duc"] },
  { canonical: "Huyện Bình Chánh", variants: ["huyen binh chanh", "binh chanh"] },
  { canonical: "Huyện Cần Giờ", variants: ["huyen can gio", "can gio"] },
  { canonical: "Huyện Củ Chi", variants: ["huyen cu chi", "cu chi"] },
  { canonical: "Huyện Hóc Môn", variants: ["huyen hoc mon", "hoc mon"] },
  { canonical: "Huyện Nhà Bè", variants: ["huyen nha be", "nha be"] },
];

const HCMC_ADMINISTRATIVE_RULES: HcmAdministrativeRule[] = [
  {
    legacyDistrict: "Quận Bình Thạnh",
    legacyDistrictAliases: ["Bình Thạnh", "Quận Bình Thạnh"],
    legacyWards: ["Phường 5", "Phường 11", "Phường 13"],
    newWard: "Phường Bình Lợi Trung",
    newWardAliases: ["Bình Lợi Trung", "Phường Bình Lợi Trung"],
  },
];

export const DEFAULT_HCMC_LOCATION: LatLng = {
  lat: 10.762622,
  lng: 106.660172,
};

export class LocationLookupError extends Error {
  issue: LocationLookupIssue;

  constructor(issue: LocationLookupIssue, message?: string) {
    super(message ?? issue);
    this.name = "LocationLookupError";
    this.issue = issue;
  }
}

function normalizePart(value?: string) {
  return value?.trim() ?? "";
}

function collapseWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function collapseCommas(value: string) {
  return collapseWhitespace(
    value
      .replace(/[，、]/g, ",")
      .replace(/\s*,\s*/g, ", ")
      .replace(/(?:,\s*){2,}/g, ", ")
      .replace(/^,\s*|\s*,$/g, "")
  );
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9\s,/.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toAsciiAddress(value: string) {
  return collapseWhitespace(
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[đĐ]/g, "d")
  );
}

function tokenize(value: string) {
  return normalizeText(value)
    .split(/[,\s/.-]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
}

function uniqueNormalized(parts: string[]) {
  const output: string[] = [];

  for (const part of parts) {
    const trimmed = normalizePart(part);
    if (!trimmed) continue;

    const normalized = normalizeText(trimmed);
    if (!normalized) continue;

    const existingIndex = output.findIndex((item) => {
      const normalizedItem = normalizeText(item);
      return (
        normalizedItem === normalized ||
        normalizedItem.includes(normalized) ||
        normalized.includes(normalizedItem)
      );
    });

    if (existingIndex === -1) {
      output.push(trimmed);
      continue;
    }

    if (normalized.length > normalizeText(output[existingIndex]).length) {
      output[existingIndex] = trimmed;
    }
  }

  return output;
}

function dedupeExactParts(parts: string[]) {
  const output: string[] = [];
  const seen = new Set<string>();

  for (const part of parts) {
    const trimmed = normalizePart(part);
    if (!trimmed) continue;

    const key = normalizeText(trimmed);
    if (seen.has(key)) continue;

    seen.add(key);
    output.push(trimmed);
  }

  return output;
}

function mergeLocationParts(parts: Array<string | undefined>) {
  return uniqueNormalized(parts.filter(Boolean) as string[]);
}

function splitAddressSegments(value?: string) {
  return collapseCommas(value ?? "")
    .split(",")
    .map((segment) => segment.trim())
    .filter(Boolean);
}

function toFiniteNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toLocation(candidate?: { lat?: unknown; lon?: unknown; lng?: unknown } | null) {
  if (!candidate) return null;

  const lat = toFiniteNumber(candidate.lat);
  const lng = toFiniteNumber(candidate.lon ?? candidate.lng);

  if (lat === null || lng === null) return null;
  return { lat, lng };
}

function normalizeHouseNumber(value?: string) {
  return normalizePart(value)
    .replace(/\s+/g, "")
    .replace(/[–—]/g, "-")
    .replace(/[^0-9a-zA-Z/-]/g, "")
    .toUpperCase();
}

function extractHouseAndStreet(value?: string) {
  const cleaned = collapseCommas(value ?? "");
  if (!cleaned) {
    return { houseNumber: "", streetName: "" };
  }

  const withoutAlleyPrefix = cleaned.replace(/^(hẻm|hem|ngõ|ngo|ngách|ngach)\s+/i, "");
  const matched = withoutAlleyPrefix.match(
    /^(\d+[A-Za-z]?(?:\/\d+[A-Za-z]?)*(?:-\d+[A-Za-z]?)?)\s+(.+)$/
  );

  if (!matched) {
    return {
      houseNumber: "",
      streetName: collapseWhitespace(cleaned),
    };
  }

  return {
    houseNumber: normalizeHouseNumber(matched[1]),
    streetName: collapseWhitespace(matched[2]),
  };
}

function normalizeWardValue(value?: string) {
  const trimmed = collapseCommas(value ?? "");
  if (!trimmed) return "";

  const ascii = normalizeText(trimmed);
  const matched = ascii.match(/\b(?:phuong|p)\s*\.?\s*([a-z0-9]+)\b/);

  if (matched) return `Phường ${matched[1].toUpperCase()}`;
  if (/^[0-9A-Za-z]{1,4}$/.test(trimmed)) return `Phường ${trimmed.toUpperCase()}`;
  return "";
}

function normalizeDistrictValue(value?: string) {
  const trimmed = collapseCommas(value ?? "");
  if (!trimmed) return "";

  const ascii = normalizeText(trimmed);
  if (ascii.includes("thu duc")) return "Thành phố Thủ Đức";

  const numericDistrict = ascii.match(/\b(?:quan|q)\s*\.?\s*(\d+)\b/);
  if (numericDistrict) return `Quận ${numericDistrict[1]}`;
  if (/^\d+$/.test(ascii)) return `Quận ${ascii}`;

  const districtAlias = DISTRICT_ALIAS_MAP.find((item) =>
    item.variants.some((variant) => ascii === variant || ascii.includes(variant))
  );
  if (districtAlias) return districtAlias.canonical;

  if (ascii.startsWith("huyen ")) return trimmed.replace(/^huyện|^huyen/i, "Huyện");
  if (ascii.startsWith("quan ")) return trimmed.replace(/^quận|^quan/i, "Quận");
  if (ascii.startsWith("thanh pho ") || ascii.startsWith("tp ")) {
    return trimmed.replace(/^thành phố|^thanh pho|^tp/i, "Thành phố");
  }

  return "";
}

function normalizeCityValue(value?: string) {
  const trimmed = collapseCommas(value ?? "");
  if (!trimmed) return DEFAULT_CITY;

  const ascii = normalizeText(trimmed);
  if (
    ascii.includes("ho chi minh") ||
    ascii.includes("tp hcm") ||
    ascii === "hcm" ||
    ascii === "tphcm"
  ) {
    return DEFAULT_CITY;
  }

  return trimmed;
}

function normalizeCountryValue(value?: string) {
  const trimmed = collapseCommas(value ?? "");
  if (!trimmed) return DEFAULT_COUNTRY;

  const ascii = normalizeText(trimmed);
  if (ascii === "vn" || ascii === "viet nam" || ascii === "vietnam") {
    return DEFAULT_COUNTRY;
  }

  return trimmed;
}

function normalizeKnownWardName(value?: string) {
  const trimmed = collapseCommas(value ?? "");
  if (!trimmed) return "";

  const ascii = normalizeText(trimmed);
  const matchedRule = HCMC_ADMINISTRATIVE_RULES.find((rule) =>
    rule.newWardAliases.some((alias) => normalizeText(alias) === ascii)
  );

  return matchedRule?.newWard ?? "";
}

function collectWardCandidates(parts: Array<string | undefined>) {
  const results: string[] = [];

  for (const part of parts) {
    const explicitWard = normalizeWardValue(part);
    if (explicitWard) results.push(explicitWard);

    const knownWard = normalizeKnownWardName(part);
    if (knownWard) results.push(knownWard);
  }

  return uniqueNormalized(results);
}

function collectDistrictCandidates(parts: Array<string | undefined>) {
  const results: string[] = [];

  for (const part of parts) {
    const district = normalizeDistrictValue(part);
    if (district) results.push(district);
  }

  return uniqueNormalized(results);
}

function stripStreetPrefix(value: string) {
  const withoutPrefix = collapseWhitespace(
    value.replace(/^(?:đ|d|đường|duong|street|st|road|rd|hẻm|hem|ngõ|ngo|ngách|ngach)\s*\.?\s+/i, "")
  );

  return collapseWhitespace(
    withoutPrefix.replace(
      /^(\d+[A-Za-z]?(?:\/\d+[A-Za-z]?)*(?:-\d+[A-Za-z]?)?)\s+/,
      ""
    )
  );
}

function normalizeStreetForMatch(value: string) {
  return normalizeText(stripStreetPrefix(value));
}

function buildStreetAddressVariants(primaryAddress: string, houseNumber: string, streetName: string) {
  const variants: string[] = [];
  const bareStreetName = stripStreetPrefix(streetName);

  if (houseNumber && bareStreetName) {
    variants.push(`${houseNumber} ${bareStreetName}`);
    variants.push(`${houseNumber} Đường ${bareStreetName}`);
  }

  if (bareStreetName) {
    variants.push(bareStreetName);
    variants.push(`Đường ${bareStreetName}`);
  }

  if (primaryAddress) variants.push(primaryAddress);

  return dedupeExactParts(variants);
}

function findMatchingAdministrativeRule(
  rawAdministrativeSegments: string[],
  wardCandidates: string[],
  districtCandidates: string[]
) {
  const haystack = normalizeText(rawAdministrativeSegments.join(", "));

  return HCMC_ADMINISTRATIVE_RULES.find((rule) => {
    const hasNewWard = rule.newWardAliases.some((alias) =>
      haystack.includes(normalizeText(alias))
    );
    const hasLegacyWard = wardCandidates.some((ward) =>
      rule.legacyWards.some((legacyWard) => normalizeText(legacyWard) === normalizeText(ward))
    );
    const hasLegacyDistrict = districtCandidates.some((district) =>
      rule.legacyDistrictAliases.some(
        (alias) => normalizeText(alias) === normalizeText(district)
      )
    );

    return hasNewWard || (hasLegacyWard && hasLegacyDistrict) || (hasLegacyWard && haystack.includes(normalizeText(rule.legacyDistrict)));
  });
}

export function normalizeAdministrativeAddress(
  fields: LocationAddressFields = {}
): AdministrativeNormalization {
  const primaryAddressRaw = collapseCommas(fields.primaryAddress ?? "");
  const segments = splitAddressSegments(primaryAddressRaw);
  const trailingSegments = segments.slice(1);
  const administrativeParts = [
    fields.ward,
    fields.district,
    ...trailingSegments,
  ];

  const wardCandidates = collectWardCandidates(administrativeParts);
  const districtCandidates = collectDistrictCandidates(administrativeParts);
  const city = normalizeCityValue(fields.city) || extractKnownCity(trailingSegments);
  const country =
    normalizeCountryValue(fields.country) || extractKnownCountry(trailingSegments);
  const matchingRule = findMatchingAdministrativeRule(
    administrativeParts.filter(Boolean) as string[],
    wardCandidates,
    districtCandidates
  );

  const explicitWard =
    normalizeWardValue(fields.ward) ||
    normalizeKnownWardName(fields.ward) ||
    wardCandidates[0] ||
    "";
  const explicitDistrict =
    normalizeDistrictValue(fields.district) ||
    districtCandidates[0] ||
    "";

  const wardAliases = dedupeExactParts(
    matchingRule
      ? [
          ...wardCandidates,
          explicitWard,
          matchingRule.newWard,
          ...matchingRule.newWardAliases,
        ]
      : [...wardCandidates, explicitWard]
  );

  const districtAliases = dedupeExactParts(
    matchingRule
      ? [
          ...districtCandidates,
          explicitDistrict,
          matchingRule.legacyDistrict,
          ...matchingRule.legacyDistrictAliases,
        ]
      : [...districtCandidates, explicitDistrict]
  );

  const ward = explicitWard || wardAliases[0] || "";
  const district = explicitDistrict || districtAliases[0] || "";
  const administrativeVariants = dedupeExactParts(
    [
      ...wardAliases.flatMap((wardAlias) =>
        districtAliases.length > 0
          ? districtAliases.map((districtAlias) =>
              formatAddressParts([wardAlias, districtAlias])
            )
          : [formatAddressParts([wardAlias])]
      ),
      ...wardAliases.map((wardAlias) => formatAddressParts([wardAlias])),
      ...districtAliases.map((districtAlias) => formatAddressParts([districtAlias])),
    ].filter(Boolean)
  );

  return {
    administrativeVariants,
    city,
    country,
    district,
    districtAliases,
    ward,
    wardAliases,
  };
}

function abbreviateWard(value: string) {
  const ascii = normalizeText(value);
  const matched = ascii.match(/^phuong\s+([a-z0-9]+)$/);
  if (matched) return `P${matched[1].toUpperCase()}`;
  return value;
}

function abbreviateDistrict(value: string) {
  const ascii = normalizeText(value);
  const numericDistrict = ascii.match(/^quan\s+(\d+)$/);
  if (numericDistrict) return `Q${numericDistrict[1]}`;

  if (ascii === normalizeText("Quận Bình Thạnh")) return "Bình Thạnh";
  if (ascii === normalizeText("Thành phố Thủ Đức")) return "Thủ Đức";
  return value;
}

function abbreviateCity(value: string) {
  if (normalizeText(value) === normalizeText(DEFAULT_CITY)) return "TP.HCM";
  return value;
}

function extractKnownCity(segments: string[]) {
  for (const segment of segments) {
    const normalized = normalizeCityValue(segment);
    if (normalized) return normalized;
  }
  return DEFAULT_CITY;
}

function extractKnownCountry(segments: string[]) {
  for (const segment of segments) {
    const normalized = normalizeCountryValue(segment);
    if (normalized) return normalized;
  }
  return DEFAULT_COUNTRY;
}

function looksLikePlaceName(primaryAddress: string) {
  return PLACE_NAME_KEYWORDS.test(normalizeText(primaryAddress));
}

function looksLikeStreetAddress(primaryAddress: string) {
  const ascii = normalizeText(primaryAddress);
  if (!ascii) return false;
  if (/\d+[a-z]?(?:\/\d+[a-z]?)*(?:-\d+[a-z]?)?/.test(ascii)) return true;
  if (STREET_HINT_KEYWORDS.test(ascii)) return true;
  if (looksLikePlaceName(primaryAddress)) return false;
  return tokenize(primaryAddress).length >= 2;
}

function formatAddressParts(parts: Array<string | undefined>) {
  return collapseCommas(mergeLocationParts(parts).join(", "));
}

function detectAddressTypeFromParts(
  primaryAddress: string,
  houseNumber: string,
  ward: string,
  district: string
): AddressType {
  const hasAdministrativeContext = Boolean(ward || district);
  const hasStreetLikePrimary = looksLikeStreetAddress(primaryAddress);

  if (houseNumber && primaryAddress) return "detailed";
  if (hasStreetLikePrimary && hasAdministrativeContext) return "detailed";
  return "place";
}

export function detectAddressType(input: string | LocationAddressFields): AddressType {
  const fields = typeof input === "string" ? { primaryAddress: input } : input;
  const primaryAddressRaw = collapseCommas(fields.primaryAddress ?? "");
  const segments = splitAddressSegments(primaryAddressRaw);
  const primaryAddress = collapseCommas(segments[0] ?? primaryAddressRaw);
  const administrative = normalizeAdministrativeAddress(fields);
  const { houseNumber } = extractHouseAndStreet(primaryAddress);

  return detectAddressTypeFromParts(
    primaryAddress,
    houseNumber,
    administrative.ward,
    administrative.district
  );
}

export function normalizeAddress(fields: LocationAddressFields = {}): NormalizedAddress {
  const primaryAddressRaw = collapseCommas(fields.primaryAddress ?? "");
  const segments = splitAddressSegments(primaryAddressRaw);
  const primarySegment = segments[0] ?? "";
  const administrative = normalizeAdministrativeAddress(fields);
  const { ward, district, city, country, wardAliases, districtAliases, administrativeVariants } =
    administrative;

  const primaryAddress = collapseCommas(primarySegment || primaryAddressRaw);
  const { houseNumber, streetName } = extractHouseAndStreet(primaryAddress);
  const streetVariants = buildStreetAddressVariants(primaryAddress, houseNumber, streetName);

  const detailedAddress = formatAddressParts([
    primaryAddress,
    ward,
    district,
    city,
    country,
  ]);

  const shortDetailedAddress = formatAddressParts([
    primaryAddress,
    district || ward,
    city,
    country,
  ]);

  const compactDetailedAddress = formatAddressParts([
    primaryAddress,
    ward ? abbreviateWard(ward) : "",
    district ? abbreviateDistrict(district) : "",
    city ? abbreviateCity(city) : "",
    country,
  ]);

  const placeAddress = formatAddressParts([
    primaryAddress || primaryAddressRaw,
    district,
    city,
    country,
  ]);

  const originalInput = formatAddressParts([
    primaryAddressRaw,
    fields.ward,
    fields.district,
    fields.city,
    fields.country,
  ]);

  const type =
    Boolean(primaryAddress || ward || district || city || country)
      ? detectAddressTypeFromParts(primaryAddress, houseNumber, ward, district)
      : "place";

  return {
    administrativeVariants,
    asciiDetailedAddress: toAsciiAddress(detailedAddress),
    asciiPrimaryAddress: toAsciiAddress(primaryAddress),
    city,
    compactDetailedAddress,
    country,
    detailedAddress,
    district,
    districtAliases,
    houseNumber,
    originalInput,
    placeAddress,
    primaryAddress,
    shortDetailedAddress,
    streetVariants,
    streetName,
    type,
    ward,
    wardAliases,
  };
}

export function detectDetailedAddress(input: string | LocationAddressFields) {
  return detectAddressType(input) === "detailed";
}

export function buildLocationQuery(
  fields: LocationAddressFields = {},
  options?: { includeCity?: boolean; includeCountry?: boolean }
) {
  const normalized = normalizeAddress(fields);
  return formatAddressParts([
    normalized.primaryAddress,
    normalized.ward,
    normalized.district,
    options?.includeCity === false ? "" : normalized.city,
    options?.includeCountry === false ? "" : normalized.country,
  ]);
}

function dedupeQueryPlans(plans: GeocodeQueryPlan[]) {
  const uniquePlans: GeocodeQueryPlan[] = [];
  const seen = new Set<string>();

  for (const plan of plans) {
    const key =
      plan.kind === "nominatim-structured"
        ? `${plan.stage}:${plan.kind}:${JSON.stringify(plan.structured)}`
        : `${plan.stage}:${plan.kind}:${normalizeText(plan.query)}`;

    if (seen.has(key)) continue;
    seen.add(key);
    uniquePlans.push(plan);
  }

  return uniquePlans;
}

export function buildVietnamAddressVariants(input: LocationAddressFields | NormalizedAddress) {
  return buildVietnamAddressVariantsWithOptions(input);
}

function buildVietnamAddressVariantsWithOptions(
  input: LocationAddressFields | NormalizedAddress,
  options?: { englishContext?: boolean }
) {
  const normalized =
    "houseNumber" in input ? input : normalizeAddress(input);
  const namedWardAliases = normalized.wardAliases.filter(
    (wardAlias) => !/^Phường\s+\d+$/i.test(wardAlias)
  );
  const primaryDistrict = normalized.districtAliases[0] ?? normalized.district;
  const prioritizedAdministrativeVariants = dedupeExactParts(
    [
      ...namedWardAliases.flatMap((wardAlias) => [
        formatAddressParts([wardAlias]),
        formatAddressParts([wardAlias, primaryDistrict]),
      ]),
      formatAddressParts([normalized.ward, normalized.district]),
      formatAddressParts([normalized.ward]),
      formatAddressParts([normalized.district]),
      ...normalized.administrativeVariants,
    ].filter(Boolean)
  );

  const cityContext =
    options?.englishContext &&
    normalizeText(normalized.city) === normalizeText(DEFAULT_CITY)
      ? DEFAULT_CITY_ENGLISH
      : normalized.city;
  const countryContext =
    options?.englishContext &&
    normalizeText(normalized.country) === normalizeText(DEFAULT_COUNTRY)
      ? DEFAULT_COUNTRY_ENGLISH
      : normalized.country;

  const variants = dedupeExactParts(
    [
      ...normalized.streetVariants.flatMap((streetVariant) =>
        prioritizedAdministrativeVariants.length > 0
          ? prioritizedAdministrativeVariants.map((administrativeVariant) =>
              formatAddressParts([
                streetVariant,
                administrativeVariant,
                cityContext,
                countryContext,
              ])
            )
          : [formatAddressParts([streetVariant, cityContext, countryContext])]
      ),
      ...normalized.streetVariants.map((streetVariant) =>
        formatAddressParts([streetVariant, cityContext, countryContext])
      ),
      options?.englishContext
        ? formatAddressParts([normalized.primaryAddress, normalized.ward, normalized.district, cityContext, countryContext])
        : normalized.detailedAddress,
      options?.englishContext
        ? formatAddressParts([normalized.primaryAddress, normalized.district, cityContext, countryContext])
        : normalized.compactDetailedAddress,
      options?.englishContext
        ? formatAddressParts([normalized.primaryAddress, normalized.ward, cityContext, countryContext])
        : normalized.shortDetailedAddress,
      normalized.originalInput,
    ].filter(Boolean)
  );

  return variants;
}

export function buildGeocodeQueries(fields: LocationAddressFields = {}) {
  const normalized = normalizeAddress(fields);
  const detailedPlans: GeocodeQueryPlan[] = [];
  const placePlans: GeocodeQueryPlan[] = [];
  const vietnameseVariants = buildVietnamAddressVariantsWithOptions(normalized);
  const englishVariants = buildVietnamAddressVariantsWithOptions(normalized, {
    englishContext: true,
  });

  if (normalized.type === "detailed") {
    for (const query of vietnameseVariants.slice(0, 10)) {
      detailedPlans.push({
        kind: "nominatim-text",
        label: "detailed-variant",
        query,
        stage: "detailed",
      });
    }

    for (const streetVariant of normalized.streetVariants.slice(0, 3)) {
      detailedPlans.push({
        kind: "nominatim-structured",
        label: "structured-variant",
        stage: "detailed",
        structured: {
          street: streetVariant,
          county: normalized.districtAliases[0] ?? normalized.district,
          city: normalized.city,
          state: normalized.city,
          country: normalized.country,
        },
      });
    }

    if (normalized.districtAliases[0] && normalized.streetName) {
      detailedPlans.push({
        kind: "nominatim-structured",
        label: "structured-street-name",
        stage: "detailed",
        structured: {
          street: normalized.streetName,
          county: normalized.districtAliases[0],
          city: normalized.city,
          state: normalized.city,
          country: normalized.country,
        },
      });
    }

    for (const query of [...englishVariants.slice(0, 6), ...vietnameseVariants.slice(0, 4)]) {
      detailedPlans.push({
        kind: "photon",
        label: "photon-detailed-variant",
        query: toAsciiAddress(query),
        stage: "detailed",
      });
    }
  }

  if (normalized.placeAddress) {
    placePlans.push({
      kind: "nominatim-text",
      label: "place-full",
      query: normalized.placeAddress,
      stage: "place",
    });
  }

  if (
    normalized.originalInput &&
    normalizeText(normalized.originalInput) !== normalizeText(normalized.placeAddress)
  ) {
    placePlans.push({
      kind: "nominatim-text",
      label: "place-original",
      query: normalized.originalInput,
      stage: "place",
    });
  }

  if (normalized.placeAddress) {
    placePlans.push({
      kind: "photon",
      label: "place-photon",
      query: toAsciiAddress(normalized.placeAddress),
      stage: "place",
    });
  }

  return dedupeQueryPlans([...detailedPlans, ...placePlans]);
}

export function isValidLocation(value?: LatLng | null): value is LatLng {
  return Boolean(
    value &&
      Number.isFinite(value.lat) &&
      Number.isFinite(value.lng) &&
      value.lat >= -90 &&
      value.lat <= 90 &&
      value.lng >= -180 &&
      value.lng <= 180
  );
}

export function isSameLocation(
  next?: LatLng | null,
  current?: LatLng | null,
  tolerance = 0.000001
) {
  if (!isValidLocation(next) || !isValidLocation(current)) return false;
  return (
    Math.abs(next.lat - current.lat) <= tolerance &&
    Math.abs(next.lng - current.lng) <= tolerance
  );
}

export function formatCoordinate(value?: number | null) {
  if (!Number.isFinite(value)) return "";
  return Number(value).toFixed(12).replace(/\.?0+$/, "");
}

export function toCoordinateInputValue(value?: LatLng | null) {
  return {
    lat: formatCoordinate(value?.lat),
    lng: formatCoordinate(value?.lng),
  };
}

export function parseCoordinatePair(latRaw: string, lngRaw: string) {
  const nextLat = latRaw.trim();
  const nextLng = lngRaw.trim();

  if (!nextLat && !nextLng) {
    return { issue: null as string | null, value: null as LatLng | null };
  }

  if (!nextLat || !nextLng) {
    return {
      issue: "Nhập đầy đủ latitude và longitude để cập nhật vị trí trên bản đồ.",
      value: null as LatLng | null,
    };
  }

  const lat = Number(nextLat);
  const lng = Number(nextLng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return {
      issue: "Latitude hoặc longitude không hợp lệ.",
      value: null as LatLng | null,
    };
  }

  if (lat < -90 || lat > 90) {
    return {
      issue: "Latitude phải nằm trong khoảng từ -90 đến 90.",
      value: null as LatLng | null,
    };
  }

  if (lng < -180 || lng > 180) {
    return {
      issue: "Longitude phải nằm trong khoảng từ -180 đến 180.",
      value: null as LatLng | null,
    };
  }

  return {
    issue: null as string | null,
    value: { lat, lng },
  };
}

function getAbortError() {
  return new DOMException("Aborted", "AbortError");
}

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const controller = new AbortController();
  let timedOut = false;
  const timeoutId = globalThis.setTimeout(() => {
    timedOut = true;
    controller.abort("timeout");
  }, FETCH_TIMEOUT_MS);
  const abortListener = () => controller.abort(getAbortError());
  signal?.addEventListener("abort", abortListener);

  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    if (response.status === 429) {
      throw new LocationLookupError("rate_limited");
    }

    if (!response.ok) {
      throw new LocationLookupError(
        response.status >= 500 ? "service_unavailable" : "failed"
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    if (signal?.aborted) {
      throw getAbortError();
    }

    if (error instanceof LocationLookupError) throw error;
    if (timedOut) throw new LocationLookupError("service_unavailable");
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new LocationLookupError("failed");
  } finally {
    globalThis.clearTimeout(timeoutId);
    signal?.removeEventListener("abort", abortListener);
  }
}

function shouldBiasToHcm(city: string) {
  return normalizeText(city) === normalizeText(DEFAULT_CITY);
}

function buildNominatimTextUrl(query: string, city: string) {
  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    limit: "8",
    addressdetails: "1",
    "accept-language": "vi,en",
    countrycodes: "vn",
  });

  if (shouldBiasToHcm(city)) {
    params.set("viewbox", HCMC_VIEWBOX);
    params.set("bounded", "1");
  }

  return `https://nominatim.openstreetmap.org/search?${params.toString()}`;
}

function buildNominatimStructuredUrl(
  structured: {
    city?: string;
    country?: string;
    county?: string;
    state?: string;
    street?: string;
  },
  city: string
) {
  const params = new URLSearchParams({
    format: "jsonv2",
    limit: "8",
    addressdetails: "1",
    "accept-language": "vi,en",
    countrycodes: "vn",
  });

  if (structured.street) params.set("street", structured.street);
  if (structured.county) params.set("county", structured.county);
  if (structured.city) params.set("city", structured.city);
  if (structured.state) params.set("state", structured.state);
  if (structured.country) params.set("country", structured.country);

  if (shouldBiasToHcm(city)) {
    params.set("viewbox", HCMC_VIEWBOX);
    params.set("bounded", "1");
  }

  return `https://nominatim.openstreetmap.org/search?${params.toString()}`;
}

function buildPhotonUrl(query: string) {
  const params = new URLSearchParams({
    q: query,
    limit: "8",
    lat: String(DEFAULT_HCMC_LOCATION.lat),
    lon: String(DEFAULT_HCMC_LOCATION.lng),
  });

  return `https://photon.komoot.io/api/?${params.toString()}`;
}

function buildNominatimReverseUrl(location: LatLng) {
  const params = new URLSearchParams({
    lat: String(location.lat),
    lon: String(location.lng),
    format: "jsonv2",
    addressdetails: "1",
    zoom: "18",
    "accept-language": "vi,en",
  });

  return `https://nominatim.openstreetmap.org/reverse?${params.toString()}`;
}

function mapNominatimCandidate(result: NominatimSearchResult): GeocodeCandidate | null {
  const location = toLocation({ lat: result.lat, lon: result.lon });
  if (!location) return null;

  const address = result.address ?? {};
  const fallbackName = formatAddressParts([
    [address.house_number, address.road].filter(Boolean).join(" ").trim(),
    address.suburb,
    address.city_district,
    address.city,
    address.state,
    address.country,
  ]);

  return {
    address,
    category: normalizeText(result.category ?? ""),
    importance: Number(result.importance ?? 0),
    label: result.display_name?.trim() || fallbackName,
    location,
    name: result.name?.trim() || fallbackName,
    placeRank: Number(result.place_rank ?? 0),
    source: "nominatim",
    type: normalizeText(result.type ?? ""),
  };
}

function mapPhotonCandidate(feature: PhotonFeature): GeocodeCandidate | null {
  const coordinates = feature.geometry?.coordinates;
  if (!coordinates || coordinates.length < 2) return null;

  const properties = feature.properties ?? {};
  const location = toLocation({ lat: coordinates[1], lng: coordinates[0] });
  if (!location) return null;
  const derivedRoad = properties.street || properties.name;

  const address: Record<string, string | undefined> = {
    city: properties.city,
    country: properties.country,
    country_code: properties.countrycode,
    county: properties.district,
    district: properties.district,
    house_number: properties.housenumber,
    neighbourhood: properties.locality,
    road: derivedRoad,
    state: properties.state,
  };

  const label = formatAddressParts([
    [properties.housenumber, properties.street].filter(Boolean).join(" ").trim() ||
      properties.name,
    properties.locality,
    properties.district,
    properties.city || properties.state,
    properties.country,
  ]);

  return {
    address,
    category: normalizeText(properties.osm_key ?? properties.type ?? ""),
    importance: 0,
    label,
    location,
    name: properties.name?.trim() || label,
    placeRank: 0,
    source: "photon",
    type: normalizeText(properties.osm_value ?? properties.type ?? ""),
  };
}

function dedupeCandidates(candidates: GeocodeCandidate[]) {
  const unique: GeocodeCandidate[] = [];
  const seen = new Set<string>();

  for (const candidate of candidates) {
    const key = `${candidate.location.lat.toFixed(6)}:${candidate.location.lng.toFixed(6)}:${normalizeText(candidate.label)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(candidate);
  }

  return unique;
}

async function runGeocodePlan(
  plan: GeocodeQueryPlan,
  city: string,
  signal?: AbortSignal
) {
  if (plan.kind === "nominatim-text") {
    const data = await fetchJson<NominatimSearchResult[]>(
      buildNominatimTextUrl(plan.query, city),
      signal
    );
    return dedupeCandidates(data.map(mapNominatimCandidate).filter(Boolean) as GeocodeCandidate[]);
  }

  if (plan.kind === "nominatim-structured") {
    const data = await fetchJson<NominatimSearchResult[]>(
      buildNominatimStructuredUrl(plan.structured, city),
      signal
    );
    return dedupeCandidates(data.map(mapNominatimCandidate).filter(Boolean) as GeocodeCandidate[]);
  }

  const data = await fetchJson<PhotonResponse>(buildPhotonUrl(plan.query), signal);
  return dedupeCandidates(
    (data.features ?? []).map(mapPhotonCandidate).filter(Boolean) as GeocodeCandidate[]
  );
}

function buildCandidateHaystack(candidate: GeocodeCandidate) {
  return normalizeText(
    [candidate.name, candidate.label, ...Object.values(candidate.address ?? {})]
      .filter(Boolean)
      .join(", ")
  );
}

function getCandidateStreet(candidate: GeocodeCandidate) {
  return collapseWhitespace(
    [
      candidate.address?.road,
      candidate.address?.street,
      candidate.address?.pedestrian,
      candidate.address?.footway,
      candidate.address?.residential,
      candidate.address?.path,
    ]
      .filter(Boolean)
      .join(" ")
  );
}

function getCandidateHouseNumber(candidate: GeocodeCandidate) {
  const explicitHouseNumber = normalizeHouseNumber(candidate.address?.house_number);
  if (explicitHouseNumber) return explicitHouseNumber;

  const derivedFromRoad = extractHouseAndStreet(candidate.address?.road).houseNumber;
  if (derivedFromRoad) return derivedFromRoad;

  const derivedFromName = extractHouseAndStreet(candidate.name).houseNumber;
  if (derivedFromName) return derivedFromName;

  return extractHouseAndStreet(candidate.label).houseNumber;
}

function createVariantList(value: string, kind: "ward" | "district" | "city" | "country") {
  const ascii = normalizeText(value);
  const variants = new Set<string>([ascii]);

  if (kind === "ward") {
    const matched = ascii.match(/^phuong\s+(.+)$/);
    if (matched) {
      const wardSuffix = matched[1].trim();
      variants.add(wardSuffix);

      const numericWard = wardSuffix.match(/^[a-z0-9]+$/);
      if (numericWard) {
        variants.add(`p${numericWard[0]}`);
        variants.add(`p ${numericWard[0]}`);
      }
    }
  }

  if (kind === "district") {
    const numericDistrict = ascii.match(/^quan\s+(\d+)$/);
    if (numericDistrict) {
      variants.add(`q${numericDistrict[1]}`);
      variants.add(`q ${numericDistrict[1]}`);
      variants.add(`district ${numericDistrict[1]}`);
      variants.add(numericDistrict[1]);
    }

    if (ascii.startsWith("quan ")) variants.add(ascii.replace(/^quan /, ""));
    if (ascii.startsWith("huyen ")) variants.add(ascii.replace(/^huyen /, ""));
    if (ascii.startsWith("thanh pho ")) {
      variants.add(ascii.replace(/^thanh pho /, ""));
      variants.add(ascii.replace(/^thanh pho /, "tp "));
    }
  }

  if (kind === "city" && ascii === normalizeText(DEFAULT_CITY)) {
    variants.add("ho chi minh");
    variants.add("tp hcm");
    variants.add("tp ho chi minh");
    variants.add("hcm");
    variants.add("tphcm");
  }

  if (kind === "country" && ascii === normalizeText(DEFAULT_COUNTRY)) {
    variants.add("vietnam");
    variants.add("vn");
  }

  return [...variants].filter(Boolean);
}

function tokenOverlap(expected: string, actual: string) {
  const expectedTokens = tokenize(expected);
  const actualTokens = new Set(tokenize(actual));
  if (expectedTokens.length === 0) return 0;

  const matches = expectedTokens.filter((token) => actualTokens.has(token)).length;
  return matches / expectedTokens.length;
}

function isPoiLikeCandidate(candidate: GeocodeCandidate) {
  return (
    ["amenity", "office", "shop", "tourism", "leisure"].includes(candidate.category) ||
    ["university", "school", "college", "hospital", "hotel"].includes(candidate.type)
  );
}

function containsVariant(haystack: string, variants: string[]) {
  return variants.some(
    (variant) =>
      haystack === variant ||
      haystack.includes(` ${variant}`) ||
      haystack.includes(`${variant},`) ||
      haystack.startsWith(`${variant} `) ||
      haystack.startsWith(`${variant},`)
  );
}

function scoreCandidateInternal(candidate: GeocodeCandidate, normalized: NormalizedAddress) {
  let score = 0;
  const reason: string[] = [];
  const haystack = buildCandidateHaystack(candidate);
  const candidateStreet = normalizeStreetForMatch(getCandidateStreet(candidate));
  const candidateHouseNumber = getCandidateHouseNumber(candidate);

  const typeWeight = RESULT_TYPE_WEIGHTS[candidate.type] ?? 0;
  if (typeWeight) {
    score += typeWeight;
    reason.push(`type:${typeWeight}`);
  }

  const categoryWeight = RESULT_CATEGORY_WEIGHTS[candidate.category] ?? 0;
  if (categoryWeight) {
    score += categoryWeight;
    reason.push(`category:${categoryWeight}`);
  }

  score += Math.round(candidate.importance * 10);
  score += Math.round(candidate.placeRank / 10);

  if (normalized.type === "detailed") {
    if (normalized.houseNumber) {
      if (candidateHouseNumber && candidateHouseNumber === normalized.houseNumber) {
        score += 130;
        reason.push("house:exact");
      } else if (
        candidateHouseNumber &&
        (candidateHouseNumber.includes(normalized.houseNumber) ||
          normalized.houseNumber.includes(candidateHouseNumber))
      ) {
        score += 45;
        reason.push("house:partial");
      } else if (candidateHouseNumber) {
        score -= 85;
        reason.push("house:mismatch");
      } else {
        score -= 8;
        reason.push("house:missing");
      }
    }

    if (normalized.streetName) {
      const expectedStreet = normalizeStreetForMatch(normalized.streetName);
      if (candidateStreet && candidateStreet === expectedStreet) {
        score += 70;
        reason.push("street:exact");
      } else if (
        candidateStreet &&
        (candidateStreet.includes(expectedStreet) || expectedStreet.includes(candidateStreet))
      ) {
        score += 52;
        reason.push("street:contains");
      } else {
        const overlap = tokenOverlap(expectedStreet, candidateStreet || haystack);
        if (overlap >= 0.9) {
          score += 45;
          reason.push("street:token-high");
        } else if (overlap >= 0.65) {
          score += 28;
          reason.push("street:token-mid");
        } else {
          score -= 22;
          reason.push("street:mismatch");
        }
      }
    }

    if (
      candidate.category === "highway" &&
      ["bus_stop", "platform"].includes(candidate.type)
    ) {
      score -= 48;
      reason.push("detailed:transport-penalty");
    }

    if (candidate.category === "highway" && normalized.houseNumber && !candidateHouseNumber) {
      score -= 22;
      reason.push("detailed:no-house-highway");
    }
  } else if (normalized.placeAddress) {
    const expectedPlace = normalizeText(normalized.primaryAddress || normalized.placeAddress);
    const candidateIdentity = normalizeText([candidate.name, candidate.label].join(", "));

    if (expectedPlace && candidateIdentity.includes(expectedPlace)) {
      score += 82;
      reason.push("place:phrase-exact");
    } else {
      const overlap = tokenOverlap(expectedPlace || normalized.placeAddress, candidateIdentity || haystack);
      if (overlap >= 0.9) {
        score += 28;
        reason.push("place:token-high");
      } else if (overlap >= 0.6) {
        score += 14;
        reason.push("place:token-mid");
      }
    }

    if (looksLikePlaceName(normalized.primaryAddress || normalized.placeAddress)) {
      if (isPoiLikeCandidate(candidate) || candidate.category === "building") {
        score += 28;
        reason.push("place:poi-bonus");
      }

      if (["university", "school", "college", "hospital", "hotel"].includes(candidate.type)) {
        score += 24;
        reason.push("place:institution-bonus");
      }

      if (
        candidate.category === "highway" &&
        ["residential", "quarter", "neighbourhood", "suburb", "bus stop", "platform"].includes(
          candidate.type
        )
      ) {
        score -= 36;
        reason.push("place:transport-residential-penalty");
      }
    }
  }

  const administrativeRules: Array<{
    expected: string[];
    kind: "ward" | "district" | "city" | "country";
    exact: number;
    partial: number;
    penalty: number;
  }> = [
    {
      expected: normalized.wardAliases.length > 0 ? normalized.wardAliases : [normalized.ward],
      kind: "ward",
      exact: 26,
      partial: 16,
      penalty: -8,
    },
    {
      expected:
        normalized.districtAliases.length > 0
          ? normalized.districtAliases
          : [normalized.district],
      kind: "district",
      exact: 34,
      partial: 22,
      penalty: -14,
    },
    { expected: [normalized.city], kind: "city", exact: 20, partial: 12, penalty: -6 },
    { expected: [normalized.country], kind: "country", exact: 10, partial: 6, penalty: 0 },
  ];

  for (const rule of administrativeRules) {
    const variants = dedupeExactParts(
      rule.expected.flatMap((expectedValue) =>
        expectedValue ? createVariantList(expectedValue, rule.kind) : []
      )
    );
    if (variants.length === 0) continue;

    if (containsVariant(haystack, variants)) {
      score += rule.exact;
      reason.push(`${rule.kind}:exact`);
      continue;
    }

    if (variants.some((variant) => haystack.includes(variant))) {
      score += rule.partial;
      reason.push(`${rule.kind}:partial`);
      continue;
    }

    score += rule.penalty;
    reason.push(`${rule.kind}:miss`);
  }

  if (normalized.type === "detailed" && isPoiLikeCandidate(candidate)) {
    score -= 60;
    reason.push("poi:penalty");
  }

  return { candidate, reason, score };
}

export function scoreGeocodeResult(
  candidate: {
    address?: Record<string, string | undefined>;
    category: string;
    importance?: number;
    label: string;
    location?: LatLng;
    name: string;
    placeRank?: number;
    source?: "nominatim" | "photon";
    type: string;
  },
  input: string | LocationAddressFields
): ScoredGeocodeResult {
  const normalized =
    typeof input === "string"
      ? normalizeAddress({ primaryAddress: input })
      : normalizeAddress(input);

  const candidateWithDefaults: GeocodeCandidate = {
    address: candidate.address,
    category: normalizeText(candidate.category),
    importance: Number(candidate.importance ?? 0),
    label: candidate.label,
    location: candidate.location ?? DEFAULT_HCMC_LOCATION,
    name: candidate.name,
    placeRank: Number(candidate.placeRank ?? 0),
    source: candidate.source ?? "nominatim",
    type: normalizeText(candidate.type),
  };

  const result = scoreCandidateInternal(candidateWithDefaults, normalized);
  return {
    candidate: {
      label: candidateWithDefaults.label,
      location: candidateWithDefaults.location,
      source: candidateWithDefaults.source,
      type: candidateWithDefaults.type,
      category: candidateWithDefaults.category,
    },
    reason: result.reason,
    score: result.score,
  };
}

export function pickBestGeocodeResult(
  candidates: GeocodeCandidate[],
  input: string | LocationAddressFields,
  options?: { thresholdType?: AddressType }
) {
  const normalized =
    typeof input === "string"
      ? normalizeAddress({ primaryAddress: input })
      : normalizeAddress(input);

  const scored = candidates
    .map((candidate) => {
      const result = scoreCandidateInternal(candidate, normalized);
      return {
        candidate,
        reason: result.reason,
        score: result.score,
      };
    })
    .sort((left, right) => right.score - left.score);

  if (process.env.NODE_ENV !== "production" && scored.length > 0) {
    console.debug(
      "[Map geocode ranking]",
      scored.slice(0, 5).map((item) => ({
        label: item.candidate.label,
        source: item.candidate.source,
        type: item.candidate.type,
        category: item.candidate.category,
        score: item.score,
        reason: item.reason,
      }))
    );
  }

  const threshold =
    (options?.thresholdType ?? normalized.type) === "detailed"
      ? DETAILED_CONFIDENCE_THRESHOLD
      : PLACE_CONFIDENCE_THRESHOLD;

  const best = scored[0];
  if (!best || best.score < threshold) {
    return null;
  }

  return best;
}

export function pickBestAddressResult(
  candidates: GeocodeCandidate[],
  input: string | LocationAddressFields,
  options?: { thresholdType?: AddressType }
) {
  return pickBestGeocodeResult(candidates, input, options);
}

function formatCandidateLabel(candidate: GeocodeCandidate) {
  const primaryLine = formatAddressParts([
    [candidate.address?.house_number, candidate.address?.road].filter(Boolean).join(" ").trim(),
    candidate.address?.neighbourhood,
    candidate.address?.suburb,
    candidate.address?.city_district,
    candidate.address?.district,
    candidate.address?.county,
    candidate.address?.city || candidate.address?.state,
    candidate.address?.country,
  ]);

  const namedLine = formatAddressParts([
    candidate.name,
    candidate.address?.neighbourhood,
    candidate.address?.suburb,
    candidate.address?.city_district,
    candidate.address?.district,
    candidate.address?.county,
    candidate.address?.city || candidate.address?.state,
    candidate.address?.country,
  ]);

  return primaryLine || namedLine || candidate.label || candidate.name;
}

function formatReverseLabel(
  address?: Record<string, string | undefined>,
  displayName?: string
) {
  const label = formatAddressParts([
    [address?.house_number, address?.road].filter(Boolean).join(" ").trim(),
    address?.neighbourhood,
    address?.suburb,
    address?.city_district,
    address?.district,
    address?.county,
    address?.city || address?.state,
    address?.country,
  ]);

  return label || displayName?.trim() || "";
}

export async function geocodeAddress(
  fields: LocationAddressFields = {},
  signal?: AbortSignal
): Promise<ForwardGeocodeResult> {
  const normalized = normalizeAddress(fields);
  if (!normalized.originalInput && !normalized.detailedAddress && !normalized.placeAddress) {
    throw new LocationLookupError("missing");
  }

  const plans = buildGeocodeQueries(fields);
  const detailedPlans = plans.filter((plan) => plan.stage === "detailed");
  const placePlans = plans.filter((plan) => plan.stage === "place");
  const stages =
    normalized.type === "detailed"
      ? [detailedPlans, placePlans]
      : [placePlans];

  let sawRateLimit = false;
  let sawServiceUnavailable = false;
  let sawFailed = false;

  for (const stagePlans of stages) {
    if (stagePlans.length === 0) continue;

    const stageCandidates: GeocodeCandidate[] = [];

    for (const plan of stagePlans) {
      try {
        const candidates = await runGeocodePlan(plan, normalized.city, signal);
        stageCandidates.push(...candidates);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") throw error;

        if (error instanceof LocationLookupError) {
          if (error.issue === "rate_limited") {
            sawRateLimit = true;
            continue;
          }

          if (error.issue === "service_unavailable") {
            sawServiceUnavailable = true;
            continue;
          }

          if (error.issue === "failed") {
            sawFailed = true;
            continue;
          }
        }

        throw error;
      }
    }

    const best = pickBestGeocodeResult(stageCandidates, fields, {
      thresholdType: stagePlans === detailedPlans ? "detailed" : "place",
    });
    if (best) {
      return {
        location: best.candidate.location,
        label: formatCandidateLabel(best.candidate),
      };
    }
  }

  if (sawRateLimit) throw new LocationLookupError("rate_limited");
  if (sawServiceUnavailable) throw new LocationLookupError("service_unavailable");
  if (sawFailed) throw new LocationLookupError("failed");
  throw new LocationLookupError("not_found");
}

export async function reverseGeocodeLocation(
  location: LatLng,
  signal?: AbortSignal
): Promise<ReverseGeocodeResult> {
  if (!isValidLocation(location)) {
    throw new LocationLookupError("missing");
  }

  const response = await fetchJson<NominatimReverseResponse>(
    buildNominatimReverseUrl(location),
    signal
  );

  const resolvedLocation =
    toLocation({ lat: response.lat, lon: response.lon }) ?? location;
  const label = formatReverseLabel(response.address, response.display_name);

  if (!label) {
    throw new LocationLookupError("not_found");
  }

  return {
    location: resolvedLocation,
    label,
  };
}

export function getLocationLookupMessage(error: unknown, context: LookupContext) {
  const fallbackMessage =
    context === "forward"
      ? "Không thể lấy vị trí từ địa chỉ này. Hãy thử nhập chi tiết hơn hoặc chọn trực tiếp trên bản đồ."
      : "Không thể lấy địa chỉ gần đúng từ vị trí này.";

  const issue =
    error instanceof LocationLookupError
      ? error.issue
      : typeof error === "object" &&
          error &&
          "issue" in error &&
          typeof (error as { issue?: unknown }).issue === "string"
        ? ((error as { issue: LocationLookupIssue }).issue as LocationLookupIssue)
        : null;

  switch (issue) {
    case "missing":
      return context === "forward"
        ? "Hãy nhập địa chỉ trước khi lấy vị trí."
        : "Vị trí chưa hợp lệ để lấy địa chỉ.";
    case "not_found":
      return context === "forward"
        ? "Không tìm thấy vị trí phù hợp. Hãy nhập đầy đủ số nhà, đường, phường, quận và thử lại."
        : "Không tìm thấy địa chỉ gần đúng cho vị trí vừa chọn.";
    case "rate_limited":
      return "Dịch vụ bản đồ đang xử lý quá nhiều yêu cầu. Hãy chờ vài giây rồi thử lại.";
    case "service_unavailable":
      return "Dịch vụ geocoding hiện tạm thời không khả dụng. Bạn có thể chọn trực tiếp trên bản đồ.";
    case "failed":
      return fallbackMessage;
    default:
      return fallbackMessage;
  }
}
