import { ReactNode } from "react";

type SectionCardProps = {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export default function SectionCard({
  title,
  subtitle,
  right,
  children,
  className = "",
  contentClassName = "",
}: SectionCardProps) {
  return (
    <section className={`rounded-2xl border border-gray-200 bg-white/90 shadow-sm ${className}`}>
      {(title || subtitle || right) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div className="min-w-0 space-y-1">
            {title ? <div className="text-base font-semibold text-gray-900">{title}</div> : null}
            {subtitle ? <div className="text-sm text-gray-500">{subtitle}</div> : null}
          </div>
          {right ? <div className="shrink-0">{right}</div> : null}
        </div>
      )}

      <div className={`p-5 ${contentClassName}`}>{children}</div>
    </section>
  );
}
