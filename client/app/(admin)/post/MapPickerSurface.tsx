"use client";

import type { RefObject } from "react";

export type MapNoticeTone = "info" | "warning" | "error" | "success";

export type MapSurfaceState =
  | {
      kind: "ready" | "loading";
      badgeLabel: string;
      title: string;
      description: string;
    }
  | {
      kind: "empty" | "error";
      badgeLabel: string;
      title: string;
      description: string;
      checklist?: string[];
      footnote?: string;
      technicalMessage?: string | null;
    };

function MapPinIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 21s6-5.686 6-11a6 6 0 1 0-12 0c0 5.314 6 11 6 11Z"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function MapConfigIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 8.75a3.25 3.25 0 1 0 0 6.5 3.25 3.25 0 0 0 0-6.5Z"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M19.4 15a1.72 1.72 0 0 0 .34 1.88l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.72 1.72 0 0 0-1.88-.34 1.72 1.72 0 0 0-1.03 1.58V22a2 2 0 1 1-4 0v-.09A1.72 1.72 0 0 0 8.97 20.3a1.72 1.72 0 0 0-1.88.34l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.72 1.72 0 0 0 4.6 15a1.72 1.72 0 0 0-1.58-1.03H3a2 2 0 1 1 0-4h.09A1.72 1.72 0 0 0 4.7 8.97a1.72 1.72 0 0 0-.34-1.88L4.3 7.03A2 2 0 0 1 7.13 4.2l.06.06A1.72 1.72 0 0 0 9.07 4a1.72 1.72 0 0 0 1.03-1.58V2a2 2 0 1 1 4 0v.09A1.72 1.72 0 0 0 15.03 4a1.72 1.72 0 0 0 1.88-.34l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.72 1.72 0 0 0 19.4 9c.7.26 1.2.94 1.2 1.75s-.5 1.49-1.2 1.75Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MapAlertIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 9v4m0 4h.01M10.62 3.89 2.54 18A2 2 0 0 0 4.27 21h15.46a2 2 0 0 0 1.73-3l-8.08-14.11a2 2 0 0 0-3.46 0Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function getBadgeClassName(kind: MapSurfaceState["kind"]) {
  switch (kind) {
    case "ready":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "loading":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "empty":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "error":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-(--theme-border) bg-(--theme-surface-muted) text-(--theme-text-muted)";
  }
}

function getNoticeClassName(tone: MapNoticeTone) {
  switch (tone) {
    case "success":
      return "border-emerald-200 bg-emerald-50 text-emerald-900";
    case "warning":
      return "border-amber-200 bg-amber-50 text-amber-900";
    case "error":
      return "border-rose-200 bg-rose-50 text-rose-900";
    case "info":
    default:
      return "border-sky-200 bg-sky-50 text-sky-900";
  }
}

function getNoticeIcon(tone: MapNoticeTone) {
  switch (tone) {
    case "success":
    case "info":
      return <MapPinIcon className="h-4 w-4" />;
    case "warning":
    case "error":
    default:
      return <MapAlertIcon className="h-4 w-4" />;
  }
}

type MapInlineNoticeProps = {
  tone: MapNoticeTone;
  title: string;
  description: string;
};

export function MapInlineNotice({
  tone,
  title,
  description,
}: MapInlineNoticeProps) {
  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-sm ${getNoticeClassName(
        tone
      )}`}
      role="status"
    >
      <div className="mt-0.5 shrink-0">{getNoticeIcon(tone)}</div>
      <div className="min-w-0">
        <div className="font-semibold">{title}</div>
        <p className="mt-1 text-sm/6 opacity-90">{description}</p>
      </div>
    </div>
  );
}

type MapPickerSurfaceProps = {
  containerRef: RefObject<HTMLDivElement | null>;
  state: MapSurfaceState;
  activityLabel?: string | null;
  helperLabel?: string | null;
};

export default function MapPickerSurface({
  containerRef,
  state,
  activityLabel,
  helperLabel,
}: MapPickerSurfaceProps) {
  const showLiveCanvas = state.kind === "ready" || state.kind === "loading";
  const showOverlay = state.kind === "loading";
  const showEmptyState = state.kind === "empty" || state.kind === "error";

  return (
    <div className="overflow-hidden rounded-2xl border border-(--theme-border) bg-(--theme-surface) shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-(--theme-border) px-4 py-4">
        <div className="space-y-1">
          <div className="text-sm font-semibold text-(--theme-text)">{state.title}</div>
          <p className="text-xs leading-5 text-(--theme-text-subtle)">{state.description}</p>
        </div>

        <span
          className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getBadgeClassName(
            state.kind
          )}`}
        >
          {state.badgeLabel}
        </span>
      </div>

      {showLiveCanvas ? (
        <div className="relative h-[21rem] overflow-hidden bg-slate-100">
          <div ref={containerRef} className="h-full w-full bg-slate-100" />

          {showOverlay ? (
            <div className="absolute inset-0 overflow-hidden bg-white/70">
              <div className="absolute inset-0 animate-pulse bg-[linear-gradient(180deg,rgba(255,255,255,0.2),rgba(255,255,255,0.75))]" />
              <div className="flex h-full flex-col justify-end gap-3 p-5">
                <div className="h-4 w-40 rounded-full bg-white/80 animate-pulse" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="h-24 rounded-2xl bg-white/80 animate-pulse" />
                  <div className="h-24 rounded-2xl bg-white/80 animate-pulse" />
                </div>
              </div>
            </div>
          ) : null}

          {activityLabel && !showOverlay ? (
            <div className="pointer-events-none absolute right-4 top-4 rounded-full border border-white/70 bg-white/92 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm">
              {activityLabel}
            </div>
          ) : null}

          {helperLabel && state.kind === "ready" ? (
            <div className="pointer-events-none absolute bottom-4 left-4 rounded-full border border-white/70 bg-white/92 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm">
              {helperLabel}
            </div>
          ) : null}
        </div>
      ) : null}

      {showEmptyState ? (
        <div className="flex min-h-[21rem] items-center justify-center bg-[linear-gradient(180deg,rgba(246,248,252,0.88),rgba(255,255,255,1))] px-6 py-8">
          <div className="mx-auto flex max-w-xl flex-col items-center text-center">
            <div
              className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl border ${
                state.kind === "error"
                  ? "border-rose-200 bg-rose-50 text-rose-600"
                  : "border-amber-200 bg-amber-50 text-amber-600"
              }`}
            >
              {state.kind === "error" ? (
                <MapAlertIcon className="h-6 w-6" />
              ) : (
                <MapConfigIcon className="h-6 w-6" />
              )}
            </div>

            <h3 className="text-base font-semibold text-(--theme-text)">{state.title}</h3>
            <p className="mt-2 max-w-lg text-sm leading-6 text-(--theme-text-subtle)">{state.description}</p>

            {state.checklist?.length ? (
              <div className="mt-5 w-full rounded-2xl border border-(--theme-border) bg-white/90 p-4 text-left shadow-sm">
                <div className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-(--theme-text-subtle)">
                  Cần kiểm tra
                </div>
                <ul className="space-y-2 text-sm text-(--theme-text-muted)">
                  {state.checklist.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-(--brand-primary)" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {state.technicalMessage ? (
              <div className="mt-4 rounded-2xl border border-dashed border-(--theme-border) bg-(--theme-surface-muted) px-4 py-3 text-left text-xs leading-5 text-(--theme-text-subtle)">
                Chi tiết kỹ thuật: {state.technicalMessage}
              </div>
            ) : null}

            {state.footnote ? (
              <div className="mt-4 text-xs leading-5 text-(--theme-text-subtle)">{state.footnote}</div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
