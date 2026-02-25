"use client";

type SettingRow = {
  key: "language" | "currency" | "timezone";
  label: string;
  value: string;
};

function SettingsValueRow({
  label,
  value,
  onEdit,
}: {
  label: string;
  value: string;
  onEdit?: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 py-6 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{label}</p>
        <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">{value || "Chưa thiết lập"}</p>
      </div>

      <button
        type="button"
        onClick={onEdit}
        className="shrink-0 self-start text-sm font-medium text-gray-700 transition hover:text-gray-900 hover:underline dark:text-gray-300 dark:hover:text-gray-100"
      >
        Chỉnh sửa
      </button>
    </div>
  );
}

const rows: SettingRow[] = [
  {
    key: "language",
    label: "Ngôn ngữ ưu tiên",
    value: "Tiếng Việt",
  },
  {
    key: "currency",
    label: "Loại tiền tệ ưu tiên",
    value: "Việt Nam Đồng",
  },
  {
    key: "timezone",
    label: "Múi giờ",
    value: "GMT+07:00 (Việt Nam)",
  },
];

export default function LanguageCurrencySettingsPanel() {
  const handleEdit = (key: SettingRow["key"]) => {
    // Preserve current behavior hook point for existing edit flow/modal wiring.
    void key;
  };

  return (
    <div className="w-full max-w-[620px]">
      <header className="pb-2">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Ngôn ngữ và loại tiền tệ</h1>
      </header>

      <section className="mt-6 border-t border-gray-200 dark:border-gray-800">
        <div className="divide-y divide-gray-200 dark:divide-gray-800">
          {rows.map((row) => (
            <SettingsValueRow key={row.key} label={row.label} value={row.value} onEdit={() => handleEdit(row.key)} />
          ))}
        </div>
      </section>
    </div>
  );
}
