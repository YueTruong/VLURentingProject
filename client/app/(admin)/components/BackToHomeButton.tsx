"use client";

import { useRouter } from "next/navigation";

type BackToHomeButtonProps = {
  href?: string;
};

export default function BackToHomeButton({
  href = "/loggedhomepage",
}: BackToHomeButtonProps) {
  const router = useRouter();

  return (
    <div
      className="
        fixed bottom-4 left-4 z-50
        w-[232px]
      "
    >
      <button
        onClick={() => router.push(href)}
        className="
          flex w-full items-center gap-3
          rounded-xl
          bg-gray-900 px-4 py-3
          text-sm font-semibold text-white
          shadow-lg
          hover:bg-gray-800
          transition
        "
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10">
          ←
        </span>
        <span>Home</span>
      </button>
    </div>
  );
}
