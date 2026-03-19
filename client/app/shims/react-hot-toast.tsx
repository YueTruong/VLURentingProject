"use client";

import type { ReactNode } from "react";

type ToastFn = ((message: string, options?: unknown) => void) & {
  success: (message: string, options?: unknown) => void;
  error: (message: string, options?: unknown) => void;
};

const noop = (message: string, options?: unknown) => {
  void options;
  if (process.env.NODE_ENV === "development") {
    console.info("[toast]", message);
  }
};

const toast = noop as ToastFn;
toast.success = noop;
toast.error = noop;

export function Toaster(props: { children?: ReactNode; [key: string]: unknown }) {
  void props;
  return null;
}

export default toast;
