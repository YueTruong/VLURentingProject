export type BadgeTone = "green" | "yellow" | "red" | "gray" | "blue";

const toneMap: Record<BadgeTone, { wrapper: string; dot: string }> = {
  green: { wrapper: "bg-green-50 text-green-700 border-green-200", dot: "bg-green-500" },
  yellow: { wrapper: "bg-yellow-50 text-yellow-800 border-yellow-200", dot: "bg-yellow-500" },
  red: { wrapper: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" },
  gray: { wrapper: "bg-gray-50 text-gray-700 border-gray-200", dot: "bg-gray-500" },
  blue: { wrapper: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500" },
};

export default function StatusBadge({ label, tone = "gray" }: { label: string; tone?: BadgeTone }) {
  const toneStyle = toneMap[tone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${toneStyle.wrapper}`}
    >
      <span className={`h-2 w-2 rounded-full ${toneStyle.dot}`} />
      {label}
    </span>
  );
}
