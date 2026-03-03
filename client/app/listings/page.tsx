"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import UserPageShell from "@/app/homepage/components/UserPageShell";
import ListingCard from "./components/ListingCard";
import { getApprovedPosts, type Post } from "@/app/services/posts";
import { askHousingAssistant } from "@/app/services/ai-assistant";
import {
  Listing,
  formatArea,
  formatPrice,
} from "./data/listings";

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  time: string;
};

type SortOption = "latest" | "oldest" | "price-asc" | "price-desc" | "area-desc" | "rating-desc";

type Criteria = {
  priceMin?: number;
  priceMax?: number;
  areaMin?: number;
  areaMax?: number;
  bedsMin?: number;
  wifi?: boolean;
  parking?: boolean;
  furnished?: boolean;
  privateWc?: boolean;
  mezzanine?: boolean;
  aircon?: boolean;
  security?: boolean;
  freeTime?: boolean;
  campus?: string;
  district?: string;
  type?: string;
  availability?: "available" | "rented";
  query?: string;
  tags?: string[];
  sortBy?: SortOption;
  videoOnly?: boolean;
};

const tagMatchers = [
  { keyword: "ban cong", tag: "Ban công" },
  { keyword: "gym", tag: "Gym" },
  { keyword: "an ninh", tag: "An ninh 24/7" },
  { keyword: "bep rieng", tag: "Bếp riêng" },
  { keyword: "gan cho", tag: "Gần chợ" },
  { keyword: "view song", tag: "View sông" },
  { keyword: "cong dong", tag: "Cộng đồng" },
  { keyword: "linh hoat", tag: "Linh hoạt" },
  { keyword: "khong gian chung", tag: "Không gian chung" },
  { keyword: "gan tram xe buyt", tag: "Gần trạm xe buýt" },
  { keyword: "yen tinh", tag: "Yên tĩnh" },
  { keyword: "phu hop gia dinh", tag: "Phù hợp gia đình" },
];

const formatAmenityLabel = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const normalized = trimmed
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  const lookup: Record<string, string> = {
    wifi: "Wi-Fi",
    "may lanh": "Máy lạnh",
    "gio giac tu do": "Giờ giấc tự do",
    "giu xe": "Giữ xe",
    parking: "Giữ xe",
    "gac lung": "Gác lửng",
    "wc rieng": "WC riêng",
  };
  return lookup[normalized] ?? trimmed;
};

const typeMatchers = [
  { keyword: "studio", type: "Studio" },
  { keyword: "can ho", type: "Căn hộ" },
  { keyword: "apartment", type: "Căn hộ" },
  { keyword: "nha nguyen can", type: "Nhà nguyên căn" },
  { keyword: "ky tuc xa", type: "Ký túc xá" },
  { keyword: "ktx", type: "Ký túc xá" },
  { keyword: "o ghep", type: "Ở ghép" },
  { keyword: "co-living", type: "Ở ghép" },
  { keyword: "coliving", type: "Ở ghép" },
  { keyword: "phong tro", type: "Phòng trọ" },
  { keyword: "nha tro", type: "Phòng trọ" },
  { keyword: "room", type: "Phòng trọ" },
];

const normalizeText = (input: string) =>
  input
    .toLowerCase()
    .replace(/m²/g, "m2")
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const normalizeAmenityToken = (value: string) =>
  normalizeText(value)
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const hasAmenityKeyword = (tags: string[], keywords: string[]) => {
  const normalizedTags = tags.map(normalizeAmenityToken);
  return keywords.some((keyword) => {
    const normalizedKeyword = normalizeAmenityToken(keyword);
    if (!normalizedKeyword) return false;
    return normalizedTags.some(
      (tag) => tag.includes(normalizedKeyword) || normalizedKeyword.includes(tag),
    );
  });
};

const WIFI_KEYWORDS = ["wifi", "wi fi", "wi-fi"];
const PARKING_KEYWORDS = ["giu xe", "gui xe", "bai xe", "dau xe", "parking", "garage", "gara"];
const FURNISHED_KEYWORDS = ["noi that", "day du noi that", "full noi that", "furnished"];
const PRIVATE_WC_KEYWORDS = ["wc rieng", "ve sinh rieng", "toilet rieng", "nha ve sinh rieng"];
const MEZZANINE_KEYWORDS = ["gac lung", "co gac", "mezzanine"];
const AIRCON_KEYWORDS = ["may lanh", "dieu hoa", "aircon", "air conditioner"];
const SECURITY_KEYWORDS = ["an ninh", "bao ve", "camera", "24 7", "24/7"];
const FREE_TIME_KEYWORDS = ["gio giac tu do", "tu do gio giac", "khong gio nghiem", "gio tu do"];

const parseNumber = (value: string) => {
  const cleaned = value.trim();
  if (!cleaned) return undefined;
  const parsed = Number(cleaned.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : undefined;
};

const toNumberValue = (value: number | string | undefined | null) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const toPriceMillionValue = (value: number | string | undefined | null) => {
  const raw = toNumberValue(value);
  return raw >= 100000 ? raw / 1_000_000 : raw;
};

const extractLastSegment = (value: string) => {
  const parts = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : value;
};

const buildUpdatedLabelFrom = (value?: string | null) => {
  if (!value) return "Vừa cập nhật";
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "Vừa cập nhật";
  const diffMs = Date.now() - timestamp;
  if (!Number.isFinite(diffMs) || diffMs < 0) return "Vừa cập nhật";
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return "Vừa cập nhật";
  if (diffHours < 24) return `Cập nhật ${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  return `Cập nhật ${diffDays} ngày trước`;
};

const hasCoordinates = (item: Listing) =>
  typeof item.latitude === "number" &&
  typeof item.longitude === "number" &&
  Number.isFinite(item.latitude) &&
  Number.isFinite(item.longitude);

const hasMapQuery = (item: Listing) => {
  if (hasCoordinates(item)) return true;
  return Boolean(item.location?.trim());
};

const buildMapQuery = (item: Listing) => {
  if (hasCoordinates(item)) {
    return `${item.latitude},${item.longitude}`;
  }
  return item.location?.trim() || item.district || "Hồ Chí Minh";
};

const mapPostToListing = (post: Post): Listing => {
  const amenityNames = (post.amenities ?? [])
    .map((amenity) => formatAmenityLabel(amenity?.name ?? ""))
    .filter(Boolean);
  const hasWifiAmenity = hasAmenityKeyword(amenityNames, WIFI_KEYWORDS);
  const hasParkingAmenity = hasAmenityKeyword(amenityNames, PARKING_KEYWORDS);
  const hasFurnishedAmenity = hasAmenityKeyword(amenityNames, FURNISHED_KEYWORDS);
  const price = toPriceMillionValue(post.price);
  const area = toNumberValue(post.area);
  const campusFallback = "CS1";
  const categoryName = post.category?.name ?? "Unknown";
  const districtRaw = extractLastSegment(post.address || "");
  const updatedSource = post.updatedAt ?? post.createdAt ?? "";
  const updatedAtValue = updatedSource ? new Date(updatedSource).getTime() : Date.now();

  return {
    id: post.id,
    title: post.title,
    image: post.images?.[0]?.image_url || "/images/House.svg",
    location: post.address || "Unknown",
    district: districtRaw || "Chưa cập nhật",
    campus: post.campus || campusFallback,
    type: categoryName,
    beds: Math.max(1, Math.round(toNumberValue(post.max_occupancy ?? 1))),
    baths: 1,
    wifi: hasWifiAmenity,
    area: Number.isFinite(area) && area > 0 ? area : 0,
    price: Number.isFinite(price) && price > 0 ? price : 0,
    latitude: typeof post.latitude === "number" ? post.latitude : undefined,
    longitude: typeof post.longitude === "number" ? post.longitude : undefined,
    furnished: hasFurnishedAmenity,
    parking: hasParkingAmenity,
    rating: 0,
    reviews: 0,
    updatedAt: Number.isFinite(updatedAtValue) ? updatedAtValue : Date.now(),
    updatedLabel: buildUpdatedLabelFrom(updatedSource),
    tags: amenityNames,
    availability: post.availability || 'available',
    videoUrl: post.videoUrl || null,
  };
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const extractQuery = (input: string, normalized: string, districtOptions: string[]) => {
  const quotedMatch = input.match(/["“”'‘’]([^"“”'‘’]+)["“”'‘’]/);
  if (quotedMatch) return quotedMatch[1].trim();

  if (!/(tim|tim kiem|search|ten)/.test(normalized)) return undefined;

  let candidate = normalized;

  candidate = candidate.replace(/(?:co so|cs|campus|c)\s*[:#-]?\s*(1|2|3)/g, " ");
  candidate = candidate.replace(/\bq\.?\s*\d{1,2}\b/g, " ");
  candidate = candidate.replace(/\bquan\s*\d{1,2}\b/g, " ");

  for (const district of districtOptions) {
    candidate = candidate.replace(new RegExp(`\\b${escapeRegExp(normalizeText(district))}\\b`, "g"), " ");
  }

  for (const matcher of typeMatchers) {
    candidate = candidate.replace(new RegExp(`\\b${escapeRegExp(matcher.keyword)}\\b`, "g"), " ");
  }

  for (const matcher of tagMatchers) {
    candidate = candidate.replace(new RegExp(`\\b${escapeRegExp(matcher.keyword)}\\b`, "g"), " ");
  }

  candidate = candidate
    .replace(/\b(wifi|wi-fi|bai xe|giu xe|dau xe|parking|garage|gara|noi that|day du noi that|full noi that|furnished|wc rieng|ve sinh rieng|toilet rieng|nha ve sinh rieng|gac lung|co gac|mezzanine|may lanh|dieu hoa|aircon|air conditioner|an ninh|bao ve|camera|24\s*\/\s*7|24\s*7|gio giac tu do|tu do gio giac|khong gio nghiem|gio tu do)\b/g, " ")
    .replace(/\b(tim kiem|tim|search|ten|phong|nha|can ho|studio|o ghep|ky tuc xa|ktx|coliving|co-living|room)\b/g, " ")
    .replace(/\b(duoi|nho hon|toi da|<=|tren|>=|tu|it nhat|den|khoang|tam)\b/g, " ")
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:tr|trieu|m2|m)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return candidate.length >= 2 ? candidate : undefined;
};

const parseCriteria = (
  input: string,
  districtOptions: string[],
): Criteria => {
  const normalized = normalizeText(input);
  const criteria: Criteria = {};

  const campusMatch = normalized.match(/(?:co so|cs|campus|c)\s*[:#-]?\s*(1|2|3)/);
  if (campusMatch) {
    criteria.campus = `CS${campusMatch[1]}`;
  }

  const districtCandidates = districtOptions.filter((d) => d !== "Tất cả");
  for (const district of districtCandidates) {
    if (normalized.includes(normalizeText(district))) {
      criteria.district = district;
      break;
    }
  }
  if (!criteria.district) {
    const districtMatch = normalized.match(/\bq\.?\s*(\d{1,2})\b/);
    if (districtMatch) {
      const districtName = `Quận ${districtMatch[1]}`;
      if (districtCandidates.includes(districtName)) {
        criteria.district = districtName;
      }
    }
  }

  for (const matcher of typeMatchers) {
    if (normalized.includes(matcher.keyword)) {
      criteria.type = matcher.type;
      break;
    }
  }

  if (/da cho thue|het phong|kin phong|full phong/.test(normalized)) {
    criteria.availability = "rented";
  } else if (/con phong|con trong|dang mo cho thue/.test(normalized)) {
    criteria.availability = "available";
  }

  if (/gia thap|re nhat|tu thap den cao/.test(normalized)) {
    criteria.sortBy = "price-asc";
  } else if (/gia cao|cao nhat|tu cao den thap/.test(normalized)) {
    criteria.sortBy = "price-desc";
  } else if (/moi nhat|moi cap nhat/.test(normalized)) {
    criteria.sortBy = "latest";
  }

  if (/co video|video tour|video phong/.test(normalized)) {
    criteria.videoOnly = true;
  }

  const tags = tagMatchers
    .filter((matcher) => normalized.includes(matcher.keyword))
    .map((matcher) => matcher.tag);
  if (tags.length) {
    criteria.tags = Array.from(new Set(tags));
  }

  if (/wifi|wi-fi/.test(normalized)) {
    criteria.wifi = true;
  }

  if (/bai xe|giu xe|dau xe|parking|garage|gara/.test(normalized)) {
    criteria.parking = true;
  }

  if (/noi that|day du noi that|full noi that|furnished/.test(normalized)) {
    criteria.furnished = true;
  }

  if (/wc rieng|ve sinh rieng|toilet rieng|nha ve sinh rieng/.test(normalized)) {
    criteria.privateWc = true;
  }

  if (/gac lung|co gac|mezzanine/.test(normalized)) {
    criteria.mezzanine = true;
  }

  if (/may lanh|dieu hoa|aircon|air conditioner/.test(normalized)) {
    criteria.aircon = true;
  }

  if (/an ninh|bao ve|camera|24\s*\/\s*7|24\s*7/.test(normalized)) {
    criteria.security = true;
  }

  if (/gio giac tu do|tu do gio giac|khong gio nghiem|gio tu do/.test(normalized)) {
    criteria.freeTime = true;
  }

  const bedsMatch = normalized.match(/(\d+)\s*(giuong|phong ngu|pn)/);
  if (bedsMatch) {
    criteria.bedsMin = Number(bedsMatch[1]);
  }

  const priceRangeMatch =
    normalized.match(/tu\s*(\d+(?:[.,]\d+)?)\s*(?:tr|trieu)?\s*den\s*(\d+(?:[.,]\d+)?)\s*(?:tr|trieu)?/) ??
    normalized.match(/(\d+(?:[.,]\d+)?)\s*(?:tr|trieu)?\s*-\s*(\d+(?:[.,]\d+)?)\s*(?:tr|trieu)?/);
  if (priceRangeMatch) {
    criteria.priceMin = parseNumber(priceRangeMatch[1]);
    criteria.priceMax = parseNumber(priceRangeMatch[2]);
  } else {
    const maxPriceMatch = normalized.match(/(duoi|nho hon|toi da|<=)\s*(\d+(?:[.,]\d+)?)\s*(?:tr|trieu)/);
    const minPriceMatch = normalized.match(/(tren|>=|tu|it nhat)\s*(\d+(?:[.,]\d+)?)\s*(?:tr|trieu)/);
    if (maxPriceMatch) {
      criteria.priceMax = parseNumber(maxPriceMatch[2]);
    }
    if (minPriceMatch) {
      criteria.priceMin = parseNumber(minPriceMatch[2]);
    }
  }

  if (criteria.priceMin === undefined && criteria.priceMax === undefined) {
    const singlePriceMatch = normalized.match(/\b(\d+(?:[.,]\d+)?)\s*(?:tr|trieu)\b/);
    if (singlePriceMatch) {
      criteria.priceMax = parseNumber(singlePriceMatch[1]);
    }
  }

  const areaRangeMatch =
    normalized.match(/tu\s*(\d+(?:[.,]\d+)?)\s*(?:m2|m)\s*den\s*(\d+(?:[.,]\d+)?)\s*(?:m2|m)/) ??
    normalized.match(/(\d+(?:[.,]\d+)?)\s*(?:m2|m)\s*-\s*(\d+(?:[.,]\d+)?)\s*(?:m2|m)/);
  if (areaRangeMatch) {
    criteria.areaMin = parseNumber(areaRangeMatch[1]);
    criteria.areaMax = parseNumber(areaRangeMatch[2]);
  } else {
    const areaSingleMatch = normalized.match(/(\d+(?:[.,]\d+)?)\s*(?:m2|m)\b/);
    if (areaSingleMatch) {
      criteria.areaMin = parseNumber(areaSingleMatch[1]);
    }
  }

  if (criteria.priceMin && criteria.priceMax && criteria.priceMin > criteria.priceMax) {
    [criteria.priceMin, criteria.priceMax] = [criteria.priceMax, criteria.priceMin];
  }

  if (criteria.areaMin && criteria.areaMax && criteria.areaMin > criteria.areaMax) {
    [criteria.areaMin, criteria.areaMax] = [criteria.areaMax, criteria.areaMin];
  }

  const extractedQuery = extractQuery(input, normalized, districtOptions);
  if (extractedQuery) {
    criteria.query = extractedQuery;
  } else if (Object.keys(criteria).length === 0 && input.trim()) {
    const isExplicitKeywordSearch = /(tim|tim kiem|search|ten)/.test(normalized);
    const tokenCount = input.trim().split(/\s+/).length;
    if (isExplicitKeywordSearch || tokenCount <= 4) {
      criteria.query = input.trim();
    }
  }

  return criteria;
};

const matchesCriteria = (item: Listing, criteria?: Criteria | null) => {
  if (!criteria) return true;

  const hasWifiAmenity = item.wifi || hasAmenityKeyword(item.tags, WIFI_KEYWORDS);
  const hasParkingAmenity = item.parking || hasAmenityKeyword(item.tags, PARKING_KEYWORDS);
  const hasFurnishedAmenity = item.furnished || hasAmenityKeyword(item.tags, FURNISHED_KEYWORDS);
  const hasPrivateWcAmenity = hasAmenityKeyword(item.tags, PRIVATE_WC_KEYWORDS);
  const hasMezzanineAmenity = hasAmenityKeyword(item.tags, MEZZANINE_KEYWORDS);
  const hasAirconAmenity = hasAmenityKeyword(item.tags, AIRCON_KEYWORDS);
  const hasSecurityAmenity = hasAmenityKeyword(item.tags, SECURITY_KEYWORDS);
  const hasFreeTimeAmenity = hasAmenityKeyword(item.tags, FREE_TIME_KEYWORDS);

  if (criteria.query) {
    const q = normalizeText(criteria.query);
    const inTitle = normalizeText(item.title).includes(q);
    const inLocation = normalizeText(item.location).includes(q);
    const inTags = item.tags.some((tag) => normalizeText(tag).includes(q));
    if (!inTitle && !inLocation && !inTags) return false;
  }

  if (criteria.campus && item.campus !== criteria.campus) return false;
  if (criteria.district && item.district !== criteria.district) return false;
  if (criteria.type && item.type !== criteria.type) return false;
  if (criteria.availability && item.availability !== criteria.availability) return false;

  if (criteria.priceMin !== undefined && item.price < criteria.priceMin) return false;
  if (criteria.priceMax !== undefined && item.price > criteria.priceMax) return false;
  if (criteria.areaMin !== undefined && item.area < criteria.areaMin) return false;
  if (criteria.areaMax !== undefined && item.area > criteria.areaMax) return false;
  if (criteria.bedsMin !== undefined && item.beds < criteria.bedsMin) return false;

  if (criteria.wifi && !hasWifiAmenity) return false;
  if (criteria.parking && !hasParkingAmenity) return false;
  if (criteria.furnished && !hasFurnishedAmenity) return false;
  if (criteria.privateWc && !hasPrivateWcAmenity) return false;
  if (criteria.mezzanine && !hasMezzanineAmenity) return false;
  if (criteria.aircon && !hasAirconAmenity) return false;
  if (criteria.security && !hasSecurityAmenity) return false;
  if (criteria.freeTime && !hasFreeTimeAmenity) return false;

  if (criteria.tags && criteria.tags.length > 0) {
    const normalizedItemTags = item.tags.map(normalizeAmenityToken);
    const hasAllTags = criteria.tags.every((tag) => {
      const normalizedCriteriaTag = normalizeAmenityToken(tag);
      return normalizedItemTags.some(
        (itemTag) => itemTag.includes(normalizedCriteriaTag) || normalizedCriteriaTag.includes(itemTag),
      );
    });
    if (!hasAllTags) return false;
  }

  if (criteria.videoOnly && !item.videoUrl) return false;

  return true;
};

const mergeCriteria = (base: Criteria, incoming?: Criteria | null): Criteria => {
  if (!incoming) return base;

  const next: Criteria = { ...base };
  const assign = <K extends keyof Criteria>(key: K, value: Criteria[K]) => {
    if (value !== undefined && value !== null) {
      next[key] = value;
    }
  };

  assign("priceMin", incoming.priceMin);
  assign("priceMax", incoming.priceMax);
  assign("areaMin", incoming.areaMin);
  assign("areaMax", incoming.areaMax);
  assign("bedsMin", incoming.bedsMin);
  assign("wifi", incoming.wifi);
  assign("parking", incoming.parking);
  assign("furnished", incoming.furnished);
  assign("privateWc", incoming.privateWc);
  assign("mezzanine", incoming.mezzanine);
  assign("aircon", incoming.aircon);
  assign("security", incoming.security);
  assign("freeTime", incoming.freeTime);
  assign("campus", incoming.campus);
  assign("district", incoming.district);
  assign("type", incoming.type);
  assign("availability", incoming.availability);
  assign("query", incoming.query);
  assign("tags", incoming.tags);
  assign("sortBy", incoming.sortBy);
  assign("videoOnly", incoming.videoOnly);

  return next;
};

const normalizeAiCriteria = (
  raw: Criteria | null | undefined,
  districtOptions: string[],
  typeOptions: string[],
): Criteria | null => {
  if (!raw) return null;

  const next: Criteria = {};
  const pickNumber = (value: unknown) => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Number(value.replace(",", "."));
      return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
  };

  const numericKeys: Array<keyof Criteria> = ["priceMin", "priceMax", "areaMin", "areaMax", "bedsMin"];
  for (const key of numericKeys) {
    const parsed = pickNumber(raw[key] as unknown);
    if (parsed !== undefined) next[key] = parsed as never;
  }

  if (raw.wifi === true) next.wifi = true;
  if (raw.parking === true) next.parking = true;
  if (raw.furnished === true) next.furnished = true;
  if (raw.privateWc === true) next.privateWc = true;
  if (raw.mezzanine === true) next.mezzanine = true;
  if (raw.aircon === true) next.aircon = true;
  if (raw.security === true) next.security = true;
  if (raw.freeTime === true) next.freeTime = true;

  const normalizedCampus = normalizeText(String(raw.campus ?? ""));
  const campusMatch = normalizedCampus.match(/(?:cs)?\s*([123])/);
  if (campusMatch) next.campus = `CS${campusMatch[1]}`;

  const normalizedAvailability = normalizeText(String(raw.availability ?? ""));
  if (/rented|da cho thue|het phong|kin phong/.test(normalizedAvailability)) {
    next.availability = "rented";
  } else if (/available|con phong|con trong/.test(normalizedAvailability)) {
    next.availability = "available";
  }

  const matchOption = (value: string, options: string[]) => {
    const normalizedValue = normalizeText(value);
    return (
      options.find((option) => normalizeText(option) === normalizedValue) ??
      options.find((option) => normalizeText(option).includes(normalizedValue)) ??
      options.find((option) => normalizedValue.includes(normalizeText(option)))
    );
  };

  if (typeof raw.district === "string" && raw.district.trim()) {
    const matchedDistrict = matchOption(raw.district.trim(), districtOptions.filter((option) => option !== "Tất cả"));
    if (matchedDistrict) next.district = matchedDistrict;
  }

  if (typeof raw.type === "string" && raw.type.trim()) {
    const matchedType =
      matchOption(raw.type.trim(), typeOptions.filter((option) => option !== "Tất cả")) ??
      typeMatchers.find((matcher) => normalizeText(raw.type ?? "").includes(matcher.keyword))?.type;
    if (matchedType) next.type = matchedType;
  }

  if (typeof raw.query === "string" && raw.query.trim()) {
    next.query = raw.query.trim();
  }

  const sortByRaw = normalizeText(String(raw.sortBy ?? ""));
  if (["latest", "oldest", "price-asc", "price-desc", "area-desc", "rating-desc"].includes(sortByRaw)) {
    next.sortBy = sortByRaw as SortOption;
  }

  if (raw.videoOnly === true) {
    next.videoOnly = true;
  }

  if (Array.isArray(raw.tags) && raw.tags.length > 0) {
    next.tags = Array.from(
      new Set(
        raw.tags
          .filter((item) => typeof item === "string")
          .map((item) => formatAmenityLabel(item))
          .filter(Boolean),
      ),
    );
  }

  return Object.keys(next).length > 0 ? next : null;
};

const buildSummary = (criteria: Criteria) => {
  const parts: string[] = [];
  if (criteria.query) parts.push(`từ khóa ${criteria.query}`);

  if (criteria.type) parts.push(`loại ${criteria.type}`);
  if (criteria.campus) parts.push(`cơ sở ${criteria.campus.replace("Cơ sở ", "")}`);
  if (criteria.district) parts.push(`khu vực ${criteria.district}`);
  if (criteria.availability) parts.push(criteria.availability === "rented" ? "trạng thái đã cho thuê" : "trạng thái còn phòng");

  if (criteria.priceMin !== undefined && criteria.priceMax !== undefined) {
    parts.push(`giá từ ${formatPrice(criteria.priceMin)} đến ${formatPrice(criteria.priceMax)}`);
  } else if (criteria.priceMin !== undefined) {
    parts.push(`giá từ ${formatPrice(criteria.priceMin)}`);
  } else if (criteria.priceMax !== undefined) {
    parts.push(`giá dưới ${formatPrice(criteria.priceMax)}`);
  }

  if (criteria.areaMin !== undefined && criteria.areaMax !== undefined) {
    parts.push(`diện tích ${criteria.areaMin}-${criteria.areaMax} m2`);
  } else if (criteria.areaMin !== undefined) {
    parts.push(`diện tích từ ${criteria.areaMin} m2`);
  }

  if (criteria.bedsMin !== undefined) {
    parts.push(`tối thiểu ${criteria.bedsMin} giường`);
  }

  if (criteria.wifi) parts.push("có Wi-Fi");
  if (criteria.parking) parts.push("có bãi xe");
  if (criteria.furnished) parts.push("đầy đủ nội thất");
  if (criteria.privateWc) parts.push("có WC riêng");
  if (criteria.mezzanine) parts.push("có gác lửng");
  if (criteria.aircon) parts.push("có máy lạnh");
  if (criteria.security) parts.push("an ninh");
  if (criteria.freeTime) parts.push("giờ giấc tự do");

  if (criteria.tags && criteria.tags.length > 0) {
    parts.push(`tiện ích: ${criteria.tags.join(", ")}`);
  }
  if (criteria.videoOnly) parts.push("có video phòng");

  return parts;
};

const formatTime = () =>
  new Date().toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

const CLOUD_AI_ENABLED = process.env.NEXT_PUBLIC_ENABLE_CLOUD_AI === "true";

const countStructuredCriteria = (criteria: Criteria) => {
  let score = 0;
  if (criteria.campus) score += 1;
  if (criteria.district) score += 1;
  if (criteria.type) score += 1;
  if (criteria.availability) score += 1;
  if (criteria.priceMin !== undefined || criteria.priceMax !== undefined) score += 1;
  if (criteria.areaMin !== undefined || criteria.areaMax !== undefined) score += 1;
  if (criteria.bedsMin !== undefined) score += 1;
  if (criteria.wifi) score += 1;
  if (criteria.parking) score += 1;
  if (criteria.furnished) score += 1;
  if (criteria.privateWc) score += 1;
  if (criteria.mezzanine) score += 1;
  if (criteria.aircon) score += 1;
  if (criteria.security) score += 1;
  if (criteria.freeTime) score += 1;
  if (criteria.videoOnly) score += 1;
  if (criteria.tags && criteria.tags.length > 0) score += 1;
  return score;
};

const hasExplicitKeywordIntent = (input: string) => {
  const normalized = normalizeText(input);
  if (/["“”'‘’][^"“”'‘’]+["“”'‘’]/.test(input)) return true;
  return /\b(tim|tim kiem|search|ten|keyword|tu khoa)\b/.test(normalized);
};

const hasFollowupIntent = (input: string) => {
  const normalized = normalizeText(input);
  return /\b(them|bo sung|con|va|kem|uu tien|them nua|ngoai ra|them tieu chi)\b/.test(normalized);
};

const optimizeCloudMergedCriteria = (
  merged: Criteria,
  cloudCriteria: Criteria | null,
  input: string,
) => {
  if (!cloudCriteria) return merged;

  const structuredScore = countStructuredCriteria(cloudCriteria);
  if (structuredScore >= 1 && merged.query && !hasExplicitKeywordIntent(input)) {
    return { ...merged, query: undefined };
  }

  return merged;
};

const buildAssistantReply = (
  criteria: Criteria,
  matchedCount: number,
  totalCount: number,
  provider?: string,
) => {
  const summary = buildSummary(criteria);

  if (summary.length === 0) {
    return "Mình chưa thấy tiêu chí rõ ràng. Bạn có thể nói cụ thể hơn về giá, khu vực, loại phòng, diện tích hoặc tiện ích.";
  }

  const modeLabel = provider === "dialogflow" ? "Dialogflow + local" : provider && provider !== "fallback" ? "OpenAI + local" : "AI mô phỏng local";
  if (matchedCount === 0) {
    return `(${modeLabel}) Mình đã lọc theo ${summary.join(", ")} nhưng chưa thấy kết quả phù hợp trong ${totalCount} tin hiện có. Bạn thử nới giá/khu vực nhé.`;
  }

  return `(${modeLabel}) Mình đã lọc theo ${summary.join(", ")} và tìm thấy ${matchedCount}/${totalCount} tin phù hợp.`;
};

const isResetCommand = (input: string) => {
  const normalized = normalizeText(input).trim();
  if (!normalized) return false;

  if (normalized === "tat ca" || normalized === "bat ky") return true;

  if (/xoa loc|reset|dat lai|mac dinh|ve mac dinh/.test(normalized)) return true;

  if (/^(co so|khu vuc|loai)\s*[:#-]?\s*tat ca$/.test(normalized)) return true;

  return false;
};

export default function ListingsPage() {
  const allOption = "Tất cả";
  const [remoteListings, setRemoteListings] = useState<Listing[]>([]);
  const [remoteLoaded, setRemoteLoaded] = useState(false);
  const [remoteError, setRemoteError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [campus, setCampus] = useState(allOption);
  const [district, setDistrict] = useState(allOption);
  const [type, setType] = useState(allOption);
  const [availability, setAvailability] = useState(allOption);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minArea, setMinArea] = useState("");
  const [maxArea, setMaxArea] = useState("");
  const [minBeds, setMinBeds] = useState("Bất kỳ");
  const [wifiOnly, setWifiOnly] = useState(false);
  const [parkingOnly, setParkingOnly] = useState(false);
  const [furnishedOnly, setFurnishedOnly] = useState(false);
  const [privateWcOnly, setPrivateWcOnly] = useState(false);
  const [mezzanineOnly, setMezzanineOnly] = useState(false);
  const [airconOnly, setAirconOnly] = useState(false);
  const [securityOnly, setSecurityOnly] = useState(false);
  const [freeTimeOnly, setFreeTimeOnly] = useState(false);
  const [videoOnly, setVideoOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("latest");
  const [selectedMapId, setSelectedMapId] = useState<number | null>(null);

  const [assistantInput, setAssistantInput] = useState("");
  const [assistantThinking, setAssistantThinking] = useState(false);
  const [assistantCriteria, setAssistantCriteria] = useState<Criteria | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "intro",
      role: "assistant",
      text: `Xin chào! Mình là trợ lý AI của VLU Renting. Bạn có thể hỏi theo hội thoại tự nhiên (ví dụ: "gần CS3, 5-7 triệu, có wifi", rồi nhắn tiếp "thêm bãi xe").`,
      time: "",
    },
  ]);
  const endRef = useRef<HTMLDivElement | null>(null);
  const messageCounter = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMessages((prev) => {
        if (prev.length === 0) return prev;
        return [{ ...prev[0], time: formatTime() }, ...prev.slice(1)];
      });
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let active = true;
    getApprovedPosts()
      .then((posts) => {
        if (!active) return;
        setRemoteListings(posts.map(mapPostToListing));
      })
      .catch(() => {
        if (!active) return;
        setRemoteError("load_failed");
      })
      .finally(() => {
        if (!active) return;
        setRemoteLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const nextMessageId = (prefix: "m" | "a") => {
    messageCounter.current += 1;
    return `${prefix}-${messageCounter.current}`;
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sourceListings = remoteListings;
  const campusFilterOptions = useMemo(
    () => [allOption, ...Array.from(new Set(sourceListings.map((item) => item.campus).filter(Boolean)))],
    [allOption, sourceListings]
  );
  const districtFilterOptions = useMemo(
    () => [allOption, ...Array.from(new Set(sourceListings.map((item) => item.district).filter(Boolean)))],
    [allOption, sourceListings]
  );
  const typeFilterOptions = useMemo(
    () => [allOption, ...Array.from(new Set(sourceListings.map((item) => item.type).filter(Boolean)))],
    [allOption, sourceListings]
  );

  const applyCriteriaToFilters = (criteria: Criteria) => {
    setQuery(criteria.query ?? "");
    setCampus(criteria.campus ?? allOption);
    setDistrict(criteria.district ?? allOption);
    setType(criteria.type ?? allOption);
    setAvailability(criteria.availability ?? allOption);
    setMinPrice(criteria.priceMin !== undefined ? String(criteria.priceMin) : "");
    setMaxPrice(criteria.priceMax !== undefined ? String(criteria.priceMax) : "");
    setMinArea(criteria.areaMin !== undefined ? String(criteria.areaMin) : "");
    setMaxArea(criteria.areaMax !== undefined ? String(criteria.areaMax) : "");
    setMinBeds(criteria.bedsMin !== undefined ? String(criteria.bedsMin) : "Bất kỳ");
    setWifiOnly(Boolean(criteria.wifi));
    setParkingOnly(Boolean(criteria.parking));
    setFurnishedOnly(Boolean(criteria.furnished));
    setPrivateWcOnly(Boolean(criteria.privateWc));
    setMezzanineOnly(Boolean(criteria.mezzanine));
    setAirconOnly(Boolean(criteria.aircon));
    setSecurityOnly(Boolean(criteria.security));
    setFreeTimeOnly(Boolean(criteria.freeTime));
    setVideoOnly(Boolean(criteria.videoOnly));
    if (criteria.sortBy) setSortBy(criteria.sortBy);
  };

  const manualCriteria = useMemo(() => {
    const criteria: Criteria = {};
    const parsedMinPrice = parseNumber(minPrice);
    const parsedMaxPrice = parseNumber(maxPrice);
    const parsedMinArea = parseNumber(minArea);
    const parsedMaxArea = parseNumber(maxArea);

    if (query.trim()) criteria.query = query.trim();

    if (campus !== allOption) criteria.campus = campus;
    if (district !== allOption) criteria.district = district;
    if (type !== allOption) criteria.type = type;
    if (availability !== allOption) criteria.availability = availability as "available" | "rented";

    if (parsedMinPrice !== undefined) criteria.priceMin = parsedMinPrice;
    if (parsedMaxPrice !== undefined) criteria.priceMax = parsedMaxPrice;
    if (parsedMinArea !== undefined) criteria.areaMin = parsedMinArea;
    if (parsedMaxArea !== undefined) criteria.areaMax = parsedMaxArea;

    if (minBeds !== "Bất kỳ") {
      const parsedBeds = Number(minBeds);
      if (Number.isFinite(parsedBeds)) criteria.bedsMin = parsedBeds;
    }

    if (wifiOnly) criteria.wifi = true;
    if (parkingOnly) criteria.parking = true;
    if (furnishedOnly) criteria.furnished = true;
    if (privateWcOnly) criteria.privateWc = true;
    if (mezzanineOnly) criteria.mezzanine = true;
    if (airconOnly) criteria.aircon = true;
    if (securityOnly) criteria.security = true;
    if (freeTimeOnly) criteria.freeTime = true;
    if (videoOnly) criteria.videoOnly = true;

    return criteria;
  }, [airconOnly, allOption, availability, campus, district, freeTimeOnly, furnishedOnly, maxArea, maxPrice, mezzanineOnly, minArea, minBeds, minPrice, parkingOnly, privateWcOnly, query, securityOnly, type, videoOnly, wifiOnly]);

  const assistantExtras = useMemo(() => {
    if (!assistantCriteria) return null;
    const extras: Criteria = {};

    if (assistantCriteria.tags && assistantCriteria.tags.length > 0) {
      extras.tags = assistantCriteria.tags;
    }

    return Object.keys(extras).length > 0 ? extras : null;
  }, [assistantCriteria]);

  const filtered = useMemo(() => {
    return sourceListings
      .filter((item) => {
        if (!matchesCriteria(item, manualCriteria)) return false;
        if (!matchesCriteria(item, assistantExtras)) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "price-asc") return a.price - b.price;
        if (sortBy === "price-desc") return b.price - a.price;
        if (sortBy === "area-desc") return b.area - a.area;
        if (sortBy === "rating-desc") return b.rating - a.rating;
        if (sortBy === "oldest") return a.updatedAt - b.updatedAt;
        return b.updatedAt - a.updatedAt;
      });
  }, [assistantExtras, manualCriteria, sortBy, sourceListings]);


  const mapListings = useMemo(() => {
    return filtered.filter((item) => hasMapQuery(item));
  }, [filtered]);

  const currentMapListing = useMemo(() => {
    if (mapListings.length === 0) return null;
    if (selectedMapId) {
      const matched = mapListings.find((item) => item.id === selectedMapId);
      if (matched) return matched;
    }
    return mapListings[0];
  }, [mapListings, selectedMapId]);

  const stats = useMemo(() => {
    if (filtered.length === 0) {
      return { avgPrice: "--", avgArea: "--", withParking: 0 };
    }
    const totalPrice = filtered.reduce((sum, item) => sum + item.price, 0);
    const totalArea = filtered.reduce((sum, item) => sum + item.area, 0);
    const withParking = filtered.filter((item) => item.parking).length;
    return {
      avgPrice: formatPrice(totalPrice / filtered.length),
      avgArea: formatArea(Math.round(totalArea / filtered.length)),
      withParking,
    };
  }, [filtered]);

  const manualBadges = useMemo(() => {
    const items = [];
    if (query.trim()) items.push(`Tìm kiếm: ${query.trim()}`);
    if (campus !== allOption) items.push(`Cơ sở: ${campus}`);
    if (district !== allOption) items.push(`Khu vực: ${district}`);
    if (type !== allOption) items.push(`Loại: ${type}`);
    if (availability !== allOption) items.push(`Tình trạng: ${availability === "rented" ? "Đã cho thuê" : "Còn phòng"}`);
    if (minPrice.trim()) items.push(`Giá từ: ${minPrice} triệu`);
    if (maxPrice.trim()) items.push(`Giá đến: ${maxPrice} triệu`);
    if (minArea.trim()) items.push(`Diện tích từ: ${minArea} m2`);
    if (maxArea.trim()) items.push(`Diện tích đến: ${maxArea} m2`);
    if (minBeds !== "Bất kỳ") items.push(`Giường: ${minBeds}+`);
    if (wifiOnly) items.push("Có Wi-Fi");
    if (parkingOnly) items.push("Có bãi xe");
    if (furnishedOnly) items.push("Đầy đủ nội thất");
    if (privateWcOnly) items.push("Có WC riêng");
    if (mezzanineOnly) items.push("Có gác lửng");
    if (airconOnly) items.push("Có máy lạnh");
    if (securityOnly) items.push("An ninh");
    if (freeTimeOnly) items.push("Giờ giấc tự do");
    if (videoOnly) items.push("Có video phòng");
    return items;
  }, [airconOnly, allOption, availability, campus, district, freeTimeOnly, furnishedOnly, maxArea, maxPrice, mezzanineOnly, minArea, minBeds, minPrice, parkingOnly, privateWcOnly, query, securityOnly, type, videoOnly, wifiOnly]);

  const assistantExtraBadges = useMemo(() => {
    if (!assistantExtras) return [];
    return buildSummary(assistantExtras);
  }, [assistantExtras]);

  const handleSend = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    const newMessage: Message = {
      id: nextMessageId("m"),
      role: "user",
      text: trimmed,
      time: formatTime(),
    };

    const resetRequested = isResetCommand(trimmed);

    let parsed = parseCriteria(trimmed, districtFilterOptions);
    let assistantText = "";
    let cloudProvider = "fallback";
    let cloudReply: string | undefined;

    const shouldUseConversationContext = Boolean(assistantCriteria) && hasFollowupIntent(trimmed);
    if (shouldUseConversationContext && assistantCriteria) {
      parsed = mergeCriteria(assistantCriteria, parsed);
    }

    if (!resetRequested && CLOUD_AI_ENABLED) {
      try {
        setAssistantThinking(true);
        const aiResult = await askHousingAssistant(
          trimmed,
          districtFilterOptions.filter((option) => option !== allOption),
        );
        const normalizedAiCriteria = normalizeAiCriteria(
          aiResult?.criteria ?? null,
          districtFilterOptions,
          typeFilterOptions,
        );
        parsed = optimizeCloudMergedCriteria(
          mergeCriteria(parsed, normalizedAiCriteria),
          normalizedAiCriteria,
          trimmed,
        );
        cloudProvider = aiResult?.provider ?? "fallback";
        cloudReply = typeof aiResult?.reply === "string" ? aiResult.reply.trim() : undefined;
      } catch {
        cloudProvider = "fallback";
      } finally {
        setAssistantThinking(false);
      }
    }

    const summary = buildSummary(parsed);

    if (summary.length === 0 && resetRequested) {
      assistantText = "Mình đã đặt lại bộ lọc về mặc định. Bạn muốn tìm theo tiêu chí nào tiếp theo?";
      const assistantMessage: Message = {
        id: nextMessageId("a"),
        role: "assistant",
        text: assistantText,
        time: formatTime(),
      };

      resetFilters();
      setMessages((prev) => [...prev, newMessage, assistantMessage]);
      setAssistantInput("");
      return;
    }

    const matched = summary.length > 0 ? sourceListings.filter((item) => matchesCriteria(item, parsed)) : [];
    assistantText = cloudReply && cloudProvider !== "fallback"
      ? `${cloudReply}
${buildAssistantReply(parsed, matched.length, sourceListings.length, cloudProvider)}`
      : buildAssistantReply(parsed, matched.length, sourceListings.length, cloudProvider);

    const assistantMessage: Message = {
      id: nextMessageId("a"),
      role: "assistant",
      text: assistantText,
      time: formatTime(),
    };

    setMessages((prev) => [...prev, newMessage, assistantMessage]);
    setAssistantInput("");

    if (summary.length > 0) {
      setAssistantCriteria(parsed);
      applyCriteriaToFilters(parsed);
    }
  };

  const resetFilters = () => {
    setQuery("");
    setCampus(allOption);
    setDistrict(allOption);
    setType(allOption);
    setAvailability(allOption);
    setMinPrice("");
    setMaxPrice("");
    setMinArea("");
    setMaxArea("");
    setMinBeds("Bất kỳ");
    setWifiOnly(false);
    setParkingOnly(false);
    setFurnishedOnly(false);
    setPrivateWcOnly(false);
    setMezzanineOnly(false);
    setAirconOnly(false);
    setSecurityOnly(false);
    setFreeTimeOnly(false);
    setVideoOnly(false);
    setSortBy("latest");
    setAssistantCriteria(null);
  };

  return (
    <UserPageShell
      title="Tất cả tin đăng"
      description="Chat với trợ lý AI hoặc dùng bộ lọc để xem nhanh tin đăng phù hợp."
    >
      <div className="space-y-8">
        {/* PANEL THỐNG KÊ */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-colors dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm text-gray-500 dark:text-gray-400">Tổng tin đăng</p>
            <div className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white">{filtered.length}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Cập nhật theo bộ lọc hiện tại.</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-colors dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm text-gray-500 dark:text-gray-400">Giá trung bình</p>
            <div className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white">{stats.avgPrice}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Tính từ danh sách hiện tại.</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-colors dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm text-gray-500 dark:text-gray-400">Diện tích trung bình</p>
            <div className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white">{stats.avgArea}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{stats.withParking} tin có bãi xe.</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
          <aside className="space-y-5">
            {/* TRỢ LÝ AI */}
            <section className="flex min-h-[420px] max-h-[620px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-colors dark:border-gray-800 dark:bg-gray-900">
              <div className="space-y-3 border-b border-gray-200 px-5 py-4 dark:border-gray-800">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Trợ lý AI</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {CLOUD_AI_ENABLED
                        ? "Cloud AI đang bật (ưu tiên Dialogflow, fallback OpenAI/local parser)."
                        : "Mô phỏng AI local đang bật (không tốn phí API). Có thể bật Dialogflow/OpenAI qua API gateway."}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        CLOUD_AI_ENABLED
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      }`}
                    >
                      {CLOUD_AI_ENABLED ? "Cloud" : "Local"}
                    </span>
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      Online
                    </span>
                    {assistantCriteria ? (
                      <button
                        type="button"
                        onClick={() => setAssistantCriteria(null)}
                        className="text-xs font-semibold text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        Xóa tiêu chí
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto bg-gray-50 px-5 py-5 dark:bg-gray-800/50">
                {messages.map((message) => {
                  const isUser = message.role === "user";
                  return (
                    <div key={message.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm transition-colors ${
                          isUser
                            ? "rounded-br-sm bg-[#D51F35] text-white"
                            : "rounded-bl-sm border border-gray-100 bg-white text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                        }`}
                      >
                        <p className="whitespace-pre-line">{message.text}</p>
                        <span className={`mt-2 block text-[11px] ${isUser ? "text-white/75" : "text-gray-400 dark:text-gray-500"}`}>
                          {message.time}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>

              <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-800">
                <form
                  onSubmit={async (event) => {
                    event.preventDefault();
                    if (assistantThinking) return;
                    await handleSend(assistantInput);
                  }}
                  className="flex flex-col gap-2 sm:flex-row sm:items-center"
                >
                  <input
                    value={assistantInput}
                    disabled={assistantThinking}
                    onChange={(event) => setAssistantInput(event.target.value)}
                    placeholder="Nhập tiêu chí (ví dụ: 2PN, dưới 6 triệu...)"
                    className="w-full rounded-full border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-gray-600"
                  />
                  <button
                    type="submit"
                    disabled={assistantThinking}
                    className="w-full rounded-full bg-[#D51F35] px-5 py-3 text-sm font-semibold text-white hover:bg-[#b01628] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    {assistantThinking ? "AI đang phân tích..." : "Gửi"}
                  </button>
                </form>
              </div>
            </section>

            {/* BỘ LỌC NÂNG CAO */}
            <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-colors dark:border-gray-800 dark:bg-gray-900 lg:sticky lg:top-24">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Bộ lọc nâng cao</h2>
                <button
                  onClick={resetFilters}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                  type="button"
                >
                  Xóa lọc
                </button>
              </div>

              <div className="space-y-2">
                <label htmlFor="query" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Tìm kiếm
                </label>
                <input
                  id="query"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Tên phòng, địa chỉ, tag..."
                  className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-[#D51F35] focus:ring-2 focus:ring-[#D51F35]/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="district" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Khu vực
                </label>
                <select
                  id="district"
                  value={district}
                  onChange={(event) => setDistrict(event.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  {districtFilterOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="campus" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Cơ sở
                </label>
                <select
                  id="campus"
                  value={campus}
                  onChange={(event) => setCampus(event.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  {campusFilterOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="type" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Loại phòng
                </label>
                <select
                  id="type"
                  value={type}
                  onChange={(event) => setType(event.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  {typeFilterOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="availability" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Tình trạng phòng
                </label>
                <select
                  id="availability"
                  value={availability}
                  onChange={(event) => setAvailability(event.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value={allOption}>{allOption}</option>
                  <option value="available">Còn phòng</option>
                  <option value="rented">Đã cho thuê</option>
                </select>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Mức giá (triệu/tháng)</p>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={minPrice}
                    onChange={(event) => setMinPrice(event.target.value)}
                    placeholder="Từ"
                    className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-[#D51F35] focus:ring-2 focus:ring-[#D51F35]/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    inputMode="decimal"
                  />
                  <input
                    value={maxPrice}
                    onChange={(event) => setMaxPrice(event.target.value)}
                    placeholder="Đến"
                    className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-[#D51F35] focus:ring-2 focus:ring-[#D51F35]/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    inputMode="decimal"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Diện tích (m2)</p>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={minArea}
                    onChange={(event) => setMinArea(event.target.value)}
                    placeholder="Từ"
                    className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-[#D51F35] focus:ring-2 focus:ring-[#D51F35]/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    inputMode="decimal"
                  />
                  <input
                    value={maxArea}
                    onChange={(event) => setMaxArea(event.target.value)}
                    placeholder="Đến"
                    className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-[#D51F35] focus:ring-2 focus:ring-[#D51F35]/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    inputMode="decimal"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="beds" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Số giường
                </label>
                <select
                  id="beds"
                  value={minBeds}
                  onChange={(event) => setMinBeds(event.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="Bất kỳ">Bất kỳ</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                </select>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tiện ích</p>
                <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={wifiOnly}
                      onChange={(event) => setWifiOnly(event.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-[#D51F35] dark:border-gray-600 dark:bg-gray-700"
                    />
                    Có Wi-Fi
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={parkingOnly}
                      onChange={(event) => setParkingOnly(event.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-[#D51F35] dark:border-gray-600 dark:bg-gray-700"
                    />
                    Có bãi xe
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={furnishedOnly}
                      onChange={(event) => setFurnishedOnly(event.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-[#D51F35] dark:border-gray-600 dark:bg-gray-700"
                    />
                    Đầy đủ nội thất
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={privateWcOnly}
                      onChange={(event) => setPrivateWcOnly(event.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-[#D51F35] dark:border-gray-600 dark:bg-gray-700"
                    />
                    Có WC riêng
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={mezzanineOnly}
                      onChange={(event) => setMezzanineOnly(event.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-[#D51F35] dark:border-gray-600 dark:bg-gray-700"
                    />
                    Có gác lửng
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={airconOnly}
                      onChange={(event) => setAirconOnly(event.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-[#D51F35] dark:border-gray-600 dark:bg-gray-700"
                    />
                    Có máy lạnh
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={securityOnly}
                      onChange={(event) => setSecurityOnly(event.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-[#D51F35] dark:border-gray-600 dark:bg-gray-700"
                    />
                    An ninh
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={freeTimeOnly}
                      onChange={(event) => setFreeTimeOnly(event.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-[#D51F35] dark:border-gray-600 dark:bg-gray-700"
                    />
                    Giờ giấc tự do
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={videoOnly}
                      onChange={(event) => setVideoOnly(event.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-[#D51F35] dark:border-gray-600 dark:bg-gray-700"
                    />
                    Có video phòng
                  </label>
                </div>
              </div>
            </div>
          </aside>

          {/* KẾT QUẢ DANH SÁCH */}
          <div className="space-y-5">
            <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-colors dark:border-gray-800 dark:bg-gray-900">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">Kết quả gợi ý</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{filtered.length} tin đăng phù hợp</p>
                </div>
                <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                  <p>Giá trung bình: {stats.avgPrice}</p>
                  <p>Diện tích trung bình: {stats.avgArea}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  {assistantExtraBadges.map((badge) => (
                    <span key={badge} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      AI: {badge}
                    </span>
                  ))}
                  {manualBadges.map((filter) => (
                    <span key={filter} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                      {filter}
                    </span>
                  ))}
                  {assistantExtraBadges.length === 0 && manualBadges.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">Chưa có tiêu chí, hiển thị toàn bộ tin đăng.</p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Sắp xếp</span>
                  <select
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value as SortOption)}
                    className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="oldest">Cũ nhất</option>
                    <option value="latest">Mới cập nhật</option>
                    <option value="price-asc">Giá tăng dần</option>
                    <option value="price-desc">Giá giảm dần</option>
                    <option value="area-desc">Diện tích giảm dần</option>
                    <option value="rating-desc">Đánh giá cao</option>
                  </select>
                </div>
              </div>
            </div>


            <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-colors dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">Bản đồ trực quan</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {mapListings.length > 0
                      ? `Có ${mapListings.length} tin có thể hiển thị bản đồ (tọa độ hoặc địa chỉ).`
                      : "Chưa có tin nào có tọa độ/địa chỉ để hiển thị trên bản đồ."}
                  </p>
                </div>
              </div>

              {currentMapListing ? (
                <div className="space-y-3">
                  <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700">
                    <iframe
                      title="Bản đồ tin đăng"
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(buildMapQuery(currentMapListing))}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                      className="h-80 w-full"
                      loading="lazy"
                      allowFullScreen
                    />
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {mapListings.slice(0, 6).map((mapItem) => (
                      <button
                        key={mapItem.id}
                        type="button"
                        onClick={() => setSelectedMapId(mapItem.id)}
                        className={`rounded-xl border px-3 py-2 text-left transition ${
                          currentMapListing.id === mapItem.id
                            ? "border-(--brand-accent) bg-(--brand-accent-soft)"
                            : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                        }`}
                      >
                        <p className="line-clamp-1 text-sm font-semibold text-gray-900 dark:text-white">{mapItem.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {mapItem.district} • {formatPrice(mapItem.price)} • {hasCoordinates(mapItem) ? "Theo tọa độ" : "Theo địa chỉ"}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400">
                  Hãy bổ sung tọa độ hoặc địa chỉ chi tiết ở bài đăng để bật bản đồ trực quan.
                </div>
              )}
            </div>

            {/* TRẠNG THÁI LOADING / ERROR / EMPTY */}
            {!remoteLoaded ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white py-16 px-4 text-center shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-900">
                <span className="mb-4 animate-spin text-4xl text-gray-900 dark:text-white">⏳</span>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">Đang tải dữ liệu từ hệ thống</p>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Vui lòng đợi trong giây lát.</p>
              </div>
            ) : remoteError ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white py-16 px-4 text-center shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-900">
                <span className="mb-4 text-4xl opacity-50">❌</span>
                <p className="text-lg font-semibold text-red-600">Không thể tải danh sách tin đăng</p>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Hệ thống đang gặp sự cố. Vui lòng thử lại sau.</p>
                <button onClick={() => window.location.reload()} className="mt-4 text-sm font-semibold text-[#D51F35] underline hover:text-red-700">Tải lại trang</button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white py-16 px-4 text-center shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-900">
                <span className="mb-4 text-5xl opacity-50">🔍</span>
                <p className="text-lg font-bold text-gray-800 dark:text-white">Không tìm thấy tin phù hợp</p>
                <p className="mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
                  Mình chưa tìm thấy phòng nào khớp với tiêu chí của bạn. Hãy thử nới lỏng khu vực, mức giá hoặc tiện ích nhé.
                </p>
                <button 
                  onClick={resetFilters} 
                  className="mt-6 rounded-full border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-800 shadow-sm transition-all hover:bg-gray-50 active:scale-95 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  Xóa bộ lọc
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5">
                {filtered.map((item) => (
                  <ListingCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </UserPageShell>
  );
}
