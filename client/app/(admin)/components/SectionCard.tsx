import React from "react";

export default function SectionCard({
  title,
  subtitle,
  right,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border bg-white ${className}`}>
      {(title || subtitle || right) && (
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
          <div className="min-w-0">
            <div className="text-base font-semibold">{title}</div>
            {subtitle ? <div className="mt-0.5 text-sm text-gray-500">
            {subtitle}</div>: null}
          </div>
          {right ? <div className="shrink-0">{right}</div> : null}
        </div>
      )}

      <div className="p-5">{children}</div>
    </section>
  );
}