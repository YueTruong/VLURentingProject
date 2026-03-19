export default function BookingSkeleton() {
  return (
    <div className="animate-pulse flex flex-col md:flex-row md:items-center gap-6 rounded-4xl border border-gray-100 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <div className="h-20 w-20 rounded-2xl bg-gray-200 dark:bg-gray-800" />
      <div className="flex-1 space-y-3">
        <div className="flex gap-2">
          <div className="h-6 w-48 bg-gray-200 rounded-lg dark:bg-gray-800" />
          <div className="h-6 w-20 bg-gray-100 rounded-full dark:bg-gray-800" />
        </div>
        <div className="h-4 w-64 bg-gray-100 rounded-lg dark:bg-gray-800" />
        <div className="flex gap-4">
          <div className="h-4 w-24 bg-gray-50 rounded-lg dark:bg-gray-800" />
          <div className="h-4 w-24 bg-gray-50 rounded-lg dark:bg-gray-800" />
        </div>
      </div>
      <div className="h-10 w-28 bg-gray-100 rounded-full dark:bg-gray-800" />
    </div>
  );
}