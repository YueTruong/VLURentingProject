export type BadgeTone = "green" | "yellow" | "red" | "gray" | "blue";

const toneMap: Record<BadgeTone, string> = {
  green: "bg-green-50 text-green-700 border-green-200",
  yellow: "bg-yellow-50 text-yellow-800 border-yellow-200",
  red: "bg-red-50 text-red-700 border-red-200",
  gray: " bg-gray-50 text-gray-700 border-gray-200",
  blue: "bg-blue-50 text-blue-700 border-blue-200",
};

export default function StatusBadge({ label, tone = "gray" }: { label: string; tone?: BadgeTone }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${toneMap[tone]}`}>
      {label}
    </span>
  );
}