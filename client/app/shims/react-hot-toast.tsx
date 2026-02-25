"use client";

import type { ReactNode } from "react";

type ToastFn = ((message: string, _opts?: unknown) => void) & {
  success: (message: string, _opts?: unknown) => void;
  error: (message: string, _opts?: unknown) => void;
};

const noop = (_message: string, _opts?: unknown) => {
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.info("[toast]", _message);
  }
};

const toast = noop as ToastFn;
toast.success = noop;
toast.error = noop;

export function Toaster(_props: { children?: ReactNode; [key: string]: unknown }) {
  return null;
}

export default toast;
