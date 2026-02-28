"use client";

import { useSyncExternalStore } from "react";
import type { RoomCardData } from "@/app/homepage/components/RoomCard";

export type FavoriteRoom = RoomCardData & { savedAt: string };

const STORAGE_KEY_PREFIX = "vlu.favorites";
const listeners = new Set<() => void>();
const EMPTY: FavoriteRoom[] = [];
const scopedCache = new Map<string, { raw: string | null; value: FavoriteRoom[] }>();

const toScopeKey = (scope?: string | number | null) =>
  scope === undefined || scope === null || scope === ""
    ? `${STORAGE_KEY_PREFIX}:guest`
    : `${STORAGE_KEY_PREFIX}:${String(scope)}`;

export const getFavoriteScope = (userId?: string | number | null) =>
  userId === undefined || userId === null || userId === "" ? "guest" : String(userId);

const emitChange = () => {
  listeners.forEach((listener) => listener());
};

const normalizeFavorite = (item: unknown): FavoriteRoom | null => {
  if (!item || typeof item !== "object") return null;
  const candidate = item as Partial<FavoriteRoom>;
  if (typeof candidate.id !== "number") return null;
  if (typeof candidate.title !== "string") return null;
  if (typeof candidate.image !== "string") return null;
  if (typeof candidate.location !== "string") return null;
  if (typeof candidate.beds !== "number") return null;
  if (typeof candidate.baths !== "number") return null;
  if (typeof candidate.wifi !== "boolean") return null;
  if (typeof candidate.area !== "string") return null;
  if (typeof candidate.price !== "string") return null;
  const savedAt = typeof candidate.savedAt === "string" ? candidate.savedAt : new Date(0).toISOString();
  return { ...(candidate as FavoriteRoom), savedAt };
};

const readFavorites = (scope?: string | number | null): FavoriteRoom[] => {
  if (typeof window === "undefined") return EMPTY;
  const storageKey = toScopeKey(scope);
  const cache = scopedCache.get(storageKey);
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (cache && raw === cache.raw) return cache.value;
    if (!raw) {
      scopedCache.set(storageKey, { raw, value: EMPTY });
      return EMPTY;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      scopedCache.set(storageKey, { raw, value: EMPTY });
      return EMPTY;
    }
    const value = parsed.map(normalizeFavorite).filter(Boolean) as FavoriteRoom[];
    scopedCache.set(storageKey, { raw, value });
    return value;
  } catch {
    scopedCache.delete(storageKey);
    return EMPTY;
  }
};

const writeFavorites = (items: FavoriteRoom[], scope?: string | number | null) => {
  if (typeof window === "undefined") return;
  const storageKey = toScopeKey(scope);
  const raw = JSON.stringify(items);
  window.localStorage.setItem(storageKey, raw);
  scopedCache.set(storageKey, { raw, value: items });
  emitChange();
};

const subscribe = (listener: () => void, scope?: string | number | null) => {
  const storageKey = toScopeKey(scope);
  listeners.add(listener);
  if (typeof window === "undefined") {
    return () => {
      listeners.delete(listener);
    };
  }
  const onStorage = (event: StorageEvent) => {
    if (event.key === storageKey) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
};

export const useFavorites = () =>
  useSyncExternalStore(
    (listener) => subscribe(listener),
    () => readFavorites(),
    () => EMPTY,
  );

export const useFavoritesByScope = (scope?: string | number | null) =>
  useSyncExternalStore(
    (listener) => subscribe(listener, scope),
    () => readFavorites(scope),
    () => EMPTY,
  );

export const toggleFavorite = (room: RoomCardData, scope?: string | number | null) => {
  const current = readFavorites(scope);
  const exists = current.find((item) => item.id === room.id);
  if (exists) {
    const next = current.filter((item) => item.id !== room.id);
    writeFavorites(next, scope);
    return next;
  }
  const next = [{ ...room, savedAt: new Date().toISOString() }, ...current];
  writeFavorites(next, scope);
  return next;
};

export const removeFavorite = (id: number, scope?: string | number | null) => {
  const current = readFavorites(scope);
  const next = current.filter((item) => item.id !== id);
  writeFavorites(next, scope);
  return next;
};

export const clearFavorites = (scope?: string | number | null) => {
  writeFavorites([], scope);
};

export const isFavorite = (id: number, scope?: string | number | null) =>
  readFavorites(scope).some((item) => item.id === id);
