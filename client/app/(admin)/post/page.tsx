"use client";

import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import UserTopBar from "@/app/homepage/components/UserTopBar";
import {
  getIdentityVerificationOverview,
  readVerificationStatusFromStorage,
  VERIFICATION_STATUS_EVENT,
} from "@/app/services/security";
import PostWizard from "./PostWizard";

const IDENTITY_VERIFICATION_URL = "/settings/identity";

export default function PostPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [isVerified, setIsVerified] = useState<boolean | null>(null);

  useEffect(() => {
    if (sessionStatus === "loading") return;

    const syncVerification = async () => {
      const accessToken = session?.user?.accessToken;
      if (!accessToken) {
        setIsVerified(readVerificationStatusFromStorage() === "verified");
        return;
      }

      try {
        const data = await getIdentityVerificationOverview(accessToken);
        setIsVerified(data.status === "verified");
      } catch {
        setIsVerified(readVerificationStatusFromStorage() === "verified");
      }
    };

    void syncVerification();
    window.addEventListener("storage", syncVerification);
    window.addEventListener("focus", syncVerification);
    window.addEventListener(VERIFICATION_STATUS_EVENT, syncVerification as EventListener);

    return () => {
      window.removeEventListener("storage", syncVerification);
      window.removeEventListener("focus", syncVerification);
      window.removeEventListener(VERIFICATION_STATUS_EVENT, syncVerification as EventListener);
    };
  }, [session?.user?.accessToken, sessionStatus]);

  return (
    <div className="min-h-screen bg-gray-50">
      <UserTopBar />
      <PostWizard />

      {isVerified === false ? (
        <div className="fixed inset-0 z-120 flex items-center justify-center bg-black/35 px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="identity-verification-title"
            className="relative w-full max-w-[520px] rounded-[30px] bg-white px-8 pb-8 pt-12 shadow-xl sm:px-10"
          >
            <p className="text-center text-sm text-gray-500">Bắt buộc xác minh danh tính trước khi đăng tin</p>

            <div className="mt-6 flex justify-center">
              <div className="relative h-[116px] w-[116px]">
                <Image src="/images/House.svg" alt="Identity verification" fill className="object-contain" />
              </div>
            </div>

            <h2
              id="identity-verification-title"
              className="mt-5 text-center text-2xl font-semibold leading-snug text-[#111827] sm:text-[28px]"
            >
              Bạn cần xác minh danh tính để tiếp tục đăng tin
            </h2>
            <p className="mt-3 text-center text-sm leading-relaxed text-gray-600 sm:text-base">
              Vui lòng hoàn tất xác minh danh tính trong phần Cài đặt để đảm bảo an toàn, minh bạch và đủ điều kiện đăng tin trên hệ thống.
            </p>

            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => router.push(IDENTITY_VERIFICATION_URL)}
                className="inline-flex min-w-[260px] items-center justify-center rounded-2xl bg-[#111827] px-7 py-3.5 text-base font-semibold text-white hover:bg-black"
              >
                Đi đến xác minh danh tính
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
