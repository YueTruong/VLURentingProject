"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import UserPageShell from "@/app/homepage/components/UserPageShell";
import ListingCard from "./components/ListingCard";
import {
  listings,
  Listing,
  formatArea,
  formatPrice,
  campusOptions,
  districtOptions,
  typeOptions,
} from "./data/listings";

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  time: string;
};

type Criteria = {
  priceMin?: number;
  priceMax?: number;
  areaMin?: number;
  areaMax?: number;
  bedsMin?: number;
  wifi?: boolean;
  parking?: boolean;
  furnished?: boolean;
  campus?: string;
  district?: string;
  type?: string;
  tags?: string[];
};

const quickPrompts = [
  "Tìm phòng dưới 5 triệu gần cơ sở 3 có Wi-Fi",
  "Studio có ban công ở Bình Thạnh khoảng 4-6 triệu",
  "Căn hộ 2PN dưới 10 triệu có bãi xe",
  "Ở ghép giá rẻ gần cơ sở 1",
];

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
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");

const parseNumber = (value: string) => {
  const cleaned = value.trim();
  if (!cleaned) return undefined;
  const parsed = Number(cleaned.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseCriteria = (input: string): Criteria => {
  const normalized = normalizeText(input);
  const criteria: Criteria = {};

  const campusMatch = normalized.match(/(?:co so|cs|campus|c)\s*[:#-]?\s*(1|2|3)/);
  if (campusMatch) {
    criteria.campus = `Cơ sở ${campusMatch[1]}`;
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

  return criteria;
};

const matchesCriteria = (item: Listing, criteria?: Criteria | null) => {
  if (!criteria) return true;

  if (criteria.campus && item.campus !== criteria.campus) return false;
  if (criteria.district && item.district !== criteria.district) return false;
  if (criteria.type && item.type !== criteria.type) return false;

  if (criteria.priceMin !== undefined && item.price < criteria.priceMin) return false;
  if (criteria.priceMax !== undefined && item.price > criteria.priceMax) return false;
  if (criteria.areaMin !== undefined && item.area < criteria.areaMin) return false;
  if (criteria.areaMax !== undefined && item.area > criteria.areaMax) return false;
  if (criteria.bedsMin !== undefined && item.beds < criteria.bedsMin) return false;

  if (criteria.wifi && !item.wifi) return false;
  if (criteria.parking && !item.parking) return false;
  if (criteria.furnished && !item.furnished) return false;

  if (criteria.tags && criteria.tags.length > 0) {
    const hasAllTags = criteria.tags.every((tag) => item.tags.includes(tag));
    if (!hasAllTags) return false;
  }

  return true;
};

const buildSummary = (criteria: Criteria) => {
  const parts: string[] = [];

  if (criteria.type) parts.push(`loại ${criteria.type}`);
  if (criteria.campus) parts.push(`cơ sở ${criteria.campus.replace("Cơ sở ", "")}`);
  if (criteria.district) parts.push(`khu vực ${criteria.district}`);

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

  if (criteria.tags && criteria.tags.length > 0) {
    parts.push(`tiện ích: ${criteria.tags.join(", ")}`);
  }

  return parts;
};

const formatTime = () =>
  new Date().toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

const isResetCommand = (input: string) => {
  const normalized = normalizeText(input).trim();
  if (!normalized) return false;

  if (normalized === "tat ca" || normalized === "bat ky") return true;

  if (/xoa loc|reset|dat lai|mac dinh|ve mac dinh/.test(normalized)) return true;

  if (/^(co so|khu vuc|loai)\s*[:#-]?\s*tat ca$/.test(normalized)) return true;

  return false;
};

export default function ListingsPage() {
  const [query, setQuery] = useState("");
  const [campus, setCampus] = useState("Tất cả");
  const [district, setDistrict] = useState("Tất cả");
  const [type, setType] = useState("Tất cả");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minBeds, setMinBeds] = useState("Bất kỳ");
  const [wifiOnly, setWifiOnly] = useState(false);
  const [parkingOnly, setParkingOnly] = useState(false);
  const [furnishedOnly, setFurnishedOnly] = useState(false);
  const [sortBy, setSortBy] = useState("latest");

  const [assistantInput, setAssistantInput] = useState("");
  const [assistantCriteria, setAssistantCriteria] = useState<Criteria | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "intro",
      role: "assistant",
      text: "Xin chào! Mình là trợ lý AI của VLU Renting. Hãy nói tiêu chí bạn cần (giá, khu vực, diện tích, tiện ích...) để mình gợi ý tin đăng phù hợp nhé.",
      time: formatTime(),
    },
  ]);
  const endRef = useRef<HTMLDivElement | null>(null);
  const messageCounter = useRef(0);

  const nextMessageId = (prefix: "m" | "a") => {
    messageCounter.current += 1;
    return `${prefix}-${messageCounter.current}`;
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const applyCriteriaToFilters = (criteria: Criteria) => {
    setQuery("");
    setCampus(criteria.campus ?? campusOptions[0]);
    setDistrict(criteria.district ?? districtOptions[0]);
    setType(criteria.type ?? typeOptions[0]);
    setMinPrice(criteria.priceMin !== undefined ? String(criteria.priceMin) : "");
    setMaxPrice(criteria.priceMax !== undefined ? String(criteria.priceMax) : "");
    setMinBeds(criteria.bedsMin !== undefined ? String(criteria.bedsMin) : "Bất kỳ");
    setWifiOnly(Boolean(criteria.wifi));
    setParkingOnly(Boolean(criteria.parking));
    setFurnishedOnly(Boolean(criteria.furnished));
  };

  const manualCriteria = useMemo(() => {
    const criteria: Criteria = {};
    const parsedMinPrice = parseNumber(minPrice);
    const parsedMaxPrice = parseNumber(maxPrice);

    if (campus !== "Tất cả") criteria.campus = campus;
    if (district !== "Tất cả") criteria.district = district;
    if (type !== "Tất cả") criteria.type = type;

    if (parsedMinPrice !== undefined) criteria.priceMin = parsedMinPrice;
    if (parsedMaxPrice !== undefined) criteria.priceMax = parsedMaxPrice;

    if (minBeds !== "Bất kỳ") {
      const parsedBeds = Number(minBeds);
      if (Number.isFinite(parsedBeds)) criteria.bedsMin = parsedBeds;
    }

    if (wifiOnly) criteria.wifi = true;
    if (parkingOnly) criteria.parking = true;
    if (furnishedOnly) criteria.furnished = true;

    return criteria;
  }, [campus, district, furnishedOnly, maxPrice, minBeds, minPrice, parkingOnly, type, wifiOnly]);

  const assistantExtras = useMemo(() => {
    if (!assistantCriteria) return null;
    const extras: Criteria = {};

    if (assistantCriteria.areaMin !== undefined) extras.areaMin = assistantCriteria.areaMin;
    if (assistantCriteria.areaMax !== undefined) extras.areaMax = assistantCriteria.areaMax;
    if (assistantCriteria.tags && assistantCriteria.tags.length > 0) {
      extras.tags = assistantCriteria.tags;
    }

    return Object.keys(extras).length > 0 ? extras : null;
  }, [assistantCriteria]);

  const filtered = useMemo(() => {
    const queryValue = query.trim().toLowerCase();

    return listings
      .filter((item) => {
        if (queryValue) {
          const inTitle = item.title.toLowerCase().includes(queryValue);
          const inLocation = item.location.toLowerCase().includes(queryValue);
          const inTags = item.tags.some((tag) => tag.toLowerCase().includes(queryValue));
          if (!inTitle && !inLocation && !inTags) return false;
        }

        if (!matchesCriteria(item, manualCriteria)) return false;
        if (!matchesCriteria(item, assistantExtras)) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "price-asc") return a.price - b.price;
        if (sortBy === "price-desc") return b.price - a.price;
        if (sortBy === "area-desc") return b.area - a.area;
        if (sortBy === "rating-desc") return b.rating - a.rating;
        return b.updatedAt - a.updatedAt;
      });
  }, [assistantExtras, manualCriteria, query, sortBy]);

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
    if (campus !== "Tất cả") items.push(`Cơ sở: ${campus}`);
    if (district !== "Tất cả") items.push(`Khu vực: ${district}`);
    if (type !== "Tất cả") items.push(`Loại: ${type}`);
    if (minPrice.trim()) items.push(`Giá từ: ${minPrice} triệu`);
    if (maxPrice.trim()) items.push(`Giá đến: ${maxPrice} triệu`);
    if (minBeds !== "Bất kỳ") items.push(`Giường: ${minBeds}+`);
    if (wifiOnly) items.push("Có Wi-Fi");
    if (parkingOnly) items.push("Có bãi xe");
    if (furnishedOnly) items.push("Đầy đủ nội thất");
    return items;
  }, [campus, district, furnishedOnly, maxPrice, minBeds, minPrice, parkingOnly, query, type, wifiOnly]);

  const assistantBadges = useMemo(() => {
    if (!assistantCriteria) return [];
    return buildSummary(assistantCriteria);
  }, [assistantCriteria]);

  const assistantExtraBadges = useMemo(() => {
    if (!assistantExtras) return [];
    return buildSummary(assistantExtras);
  }, [assistantExtras]);

  const handleSend = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    const newMessage: Message = {
      id: nextMessageId("m"),
      role: "user",
      text: trimmed,
      time: formatTime(),
    };

    const parsed = parseCriteria(trimmed);
    const summary = buildSummary(parsed);
    let assistantText = "";
    const resetRequested = isResetCommand(trimmed);

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

    if (summary.length === 0) {
      assistantText = "Mình chưa thấy tiêu chí rõ ràng. Bạn có thể thêm giá, khu vực hoặc tiện ích mong muốn nhé.";
    } else {
      const matched = listings.filter((item) => matchesCriteria(item, parsed));

      if (matched.length === 0) {
        assistantText = `Mình đã lọc theo ${summary.join(", ")} nhưng chưa tìm thấy tin phù hợp. Bạn muốn nới tiêu chí nào không?`;
      } else {
        assistantText = `Mình đã lọc theo ${summary.join(", ")} và tìm thấy ${matched.length} tin phù hợp. Bạn muốn mình lọc thêm gì nữa không?`;
      }

      assistantText += " Mình đã đồng bộ bộ lọc nâng cao theo tiêu chí này.";
    }

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
    setCampus("Tất cả");
    setDistrict("Tất cả");
    setType("Tất cả");
    setMinPrice("");
    setMaxPrice("");
    setMinBeds("Bất kỳ");
    setWifiOnly(false);
    setParkingOnly(false);
    setFurnishedOnly(false);
    setSortBy("latest");
    setAssistantCriteria(null);
  };

  return (
    <UserPageShell
      title="Tất cả tin đăng"
      description="Chat với trợ lý AI hoặc dùng bộ lọc để xem nhanh tin đăng phù hợp."
    >
      <div className="space-y-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Tổng tin đăng</p>
            <div className="mt-2 text-3xl font-extrabold text-gray-900">{filtered.length}</div>
            <p className="text-xs text-gray-500">Cập nhật theo bộ lọc hiện tại.</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Giá trung bình</p>
            <div className="mt-2 text-3xl font-extrabold text-gray-900">{stats.avgPrice}</div>
            <p className="text-xs text-gray-500">Tính từ danh sách hiện tại.</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Diện tích trung bình</p>
            <div className="mt-2 text-3xl font-extrabold text-gray-900">{stats.avgArea}</div>
            <p className="text-xs text-gray-500">{stats.withParking} tin có bãi xe.</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
          <aside className="space-y-5">
            <section className="flex min-h-[420px] max-h-[620px] flex-col rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-gray-200 px-5 py-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Trợ lý AI</h2>
                    <p className="text-xs text-gray-500">Gợi ý tin đăng theo tiêu chí của bạn</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                      Online
                    </span>
                    {assistantCriteria ? (
                      <button
                        type="button"
                        onClick={() => setAssistantCriteria(null)}
                        className="text-xs font-semibold text-gray-500 hover:text-gray-800"
                      >
                        Xóa tiêu chí
                      </button>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {quickPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => handleSend(prompt)}
                      className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {assistantBadges.length > 0 ? (
                    assistantBadges.map((badge) => (
                      <span
                        key={badge}
                        className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                      >
                        AI: {badge}
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500">Chưa có tiêu chí AI.</p>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 bg-gray-50">
                {messages.map((message) => {
                  const isUser = message.role === "user";
                  return (
                    <div key={message.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                          isUser
                            ? "bg-[#D51F35] text-white rounded-br-sm"
                            : "bg-white text-gray-900 border border-gray-100 rounded-bl-sm"
                        }`}
                      >
                        <p className="whitespace-pre-line">{message.text}</p>
                        <span className={`mt-2 block text-[11px] ${isUser ? "text-white/75" : "text-gray-400"}`}>
                          {message.time}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>

              <div className="border-t border-gray-200 px-4 py-3">
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleSend(assistantInput);
                  }}
                  className="flex flex-col gap-2 sm:flex-row sm:items-center"
                >
                  <input
                    value={assistantInput}
                    onChange={(event) => setAssistantInput(event.target.value)}
                    placeholder="Nhập tiêu chí (ví dụ: 2PN, dưới 6 triệu, có bãi xe...)"
                    className="w-full rounded-full border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-300"
                  />
                  <button
                    type="submit"
                    className="w-full rounded-full bg-[#D51F35] px-5 py-3 text-sm font-semibold text-white hover:bg-[#b01628] active:scale-95 sm:w-auto"
                  >
                    Gửi
                  </button>
                </form>
              </div>
            </section>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4 lg:sticky lg:top-24">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900">Bộ lọc nâng cao</h2>
                <button
                  onClick={resetFilters}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-800"
                  type="button"
                >
                  Xóa lọc
                </button>
              </div>

              <div className="space-y-2">
                <label htmlFor="query" className="text-sm font-semibold text-gray-700">
                  Tìm kiếm
                </label>
                <input
                  id="query"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Tên phòng, địa chỉ, tag..."
                  className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="district" className="text-sm font-semibold text-gray-700">
                  Khu vực
                </label>
                <select
                  id="district"
                  value={district}
                  onChange={(event) => setDistrict(event.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                >
                  {districtOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="campus" className="text-sm font-semibold text-gray-700">
                  Cơ sở
                </label>
                <select
                  id="campus"
                  value={campus}
                  onChange={(event) => setCampus(event.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                >
                  {campusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="type" className="text-sm font-semibold text-gray-700">
                  Loại phòng
                </label>
                <select
                  id="type"
                  value={type}
                  onChange={(event) => setType(event.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                >
                  {typeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700">Mức giá (triệu/tháng)</p>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={minPrice}
                    onChange={(event) => setMinPrice(event.target.value)}
                    placeholder="Từ"
                    className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    inputMode="decimal"
                  />
                  <input
                    value={maxPrice}
                    onChange={(event) => setMaxPrice(event.target.value)}
                    placeholder="Đến"
                    className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    inputMode="decimal"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="beds" className="text-sm font-semibold text-gray-700">
                  Số giường
                </label>
                <select
                  id="beds"
                  value={minBeds}
                  onChange={(event) => setMinBeds(event.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                >
                  <option value="Bất kỳ">Bất kỳ</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                </select>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700">Tiện ích</p>
                <div className="space-y-2 text-sm text-gray-700">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={wifiOnly}
                      onChange={(event) => setWifiOnly(event.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-[#D51F35]"
                    />
                    Có Wi-Fi
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={parkingOnly}
                      onChange={(event) => setParkingOnly(event.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-[#D51F35]"
                    />
                    Có bãi xe
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={furnishedOnly}
                      onChange={(event) => setFurnishedOnly(event.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-[#D51F35]"
                    />
                    Đầy đủ nội thất
                  </label>
                </div>
              </div>
            </div>
          </aside>

          <div className="space-y-5">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-gray-900">Kết quả gợi ý</p>
                  <p className="text-sm text-gray-600">{filtered.length} tin đăng phù hợp</p>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <p>Giá trung bình: {stats.avgPrice}</p>
                  <p>Diện tích trung bình: {stats.avgArea}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  {assistantExtraBadges.map((badge) => (
                    <span key={badge} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      AI: {badge}
                    </span>
                  ))}
                  {manualBadges.map((filter) => (
                    <span key={filter} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                      {filter}
                    </span>
                  ))}
                  {assistantExtraBadges.length === 0 && manualBadges.length === 0 ? (
                    <p className="text-sm text-gray-500">Chưa có tiêu chí, hiển thị toàn bộ tin đăng.</p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Sắp xếp</span>
                  <select
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value)}
                    className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                  >
                    <option value="latest">Mới cập nhật</option>
                    <option value="price-asc">Giá tăng dần</option>
                    <option value="price-desc">Giá giảm dần</option>
                    <option value="area-desc">Diện tích giảm dần</option>
                    <option value="rating-desc">Đánh giá cao</option>
                  </select>
                </div>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
                <p className="text-lg font-semibold text-gray-900">Không tìm thấy tin phù hợp</p>
                <p className="mt-2 text-sm text-gray-600">Hãy thử đổi khu vực, mức giá hoặc tiện ích.</p>
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
