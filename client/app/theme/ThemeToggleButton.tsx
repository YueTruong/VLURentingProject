"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "./ThemeProvider";

type ThemeToggleButtonProps = {
  className?: string;
  iconClassName?: string;
  label?: string;
};

function SunIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.5M12 18.5V21M4.22 4.22l1.77 1.77M18.01 18.01l1.77 1.77M3 12h2.5M18.5 12H21M4.22 19.78l1.77-1.77M18.01 5.99l1.77-1.77" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 14.5A8.5 8.5 0 019.5 3a7 7 0 1011.5 11.5z" />
    </svg>
  );
}

export default function ThemeToggleButton({ className, iconClassName = "h-5 w-5", label }: ThemeToggleButtonProps) {
  const { theme, toggleTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  const isDark = mounted ? theme === "dark" : false;
  const base = "inline-flex items-center justify-center gap-2 transition active:scale-95";
  const buttonClass = [base, className].filter(Boolean).join(" ");
  const nextLabel = isDark ? "sáng" : "tối";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={buttonClass}
      aria-label={`Chuyển sang giao diện ${nextLabel}`}
      title={`Chuyển sang giao diện ${nextLabel}`}
    >
      {isDark ? <SunIcon className={iconClassName} /> : <MoonIcon className={iconClassName} />}
      {label ? <span>{label}</span> : null}
    </button>
  );
}
