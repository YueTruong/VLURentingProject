"use client";

import { useSyncExternalStore } from "react";
import type { RoomCardData } from "@/app/homepage/components/RoomCard";

export type FavoriteRoom = RoomCardData & { savedAt: string };

const STORAGE_KEY = "vlu.favorites";
const listeners = new Set<() => void>();
const EMPTY: FavoriteRoom[] = [];
let cachedRaw: string | null = null;
let cachedValue: FavoriteRoom[] = EMPTY;

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

const readFavorites = (): FavoriteRoom[] => {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) return cachedValue;
    if (!raw) {
      cachedRaw = raw;
      cachedValue = EMPTY;
      return cachedValue;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      cachedRaw = raw;
      cachedValue = EMPTY;
      return cachedValue;
    }
    cachedRaw = raw;
    cachedValue = parsed.map(normalizeFavorite).filter(Boolean) as FavoriteRoom[];
    return cachedValue;
  } catch {
    cachedRaw = null;
    cachedValue = EMPTY;
    return cachedValue;
  }
};

const writeFavorites = (items: FavoriteRoom[]) => {
  if (typeof window === "undefined") return;
  const raw = JSON.stringify(items);
  window.localStorage.setItem(STORAGE_KEY, raw);
  cachedRaw = raw;
  cachedValue = items;
  emitChange();
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  if (typeof window === "undefined") {
    return () => {
      listeners.delete(listener);
    };
  }
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
};

export const useFavorites = () =>
  useSyncExternalStore(subscribe, readFavorites, () => EMPTY);

export const toggleFavorite = (room: RoomCardData) => {
  const current = readFavorites();
  const exists = current.find((item) => item.id === room.id);
  if (exists) {
    const next = current.filter((item) => item.id !== room.id);
    writeFavorites(next);
    return next;
  }
  const next = [{ ...room, savedAt: new Date().toISOString() }, ...current];
  writeFavorites(next);
  return next;
};

export const removeFavorite = (id: number) => {
  const current = readFavorites();
  const next = current.filter((item) => item.id !== id);
  writeFavorites(next);
  return next;
};

export const clearFavorites = () => {
  writeFavorites([]);
};

export const isFavorite = (id: number) =>
  readFavorites().some((item) => item.id === id);
