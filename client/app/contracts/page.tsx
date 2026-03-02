"use client";

import { useSession } from "next-auth/react";
import RentalContractWorkspace from "@/app/contracts/components/RentalContractWorkspace";
import RentalContractsPanel from "@/app/contracts/components/RentalContractsPanel";
import UserPageShell from "@/app/homepage/components/UserPageShell";

type UserRole = "admin" | "landlord" | "student";

type SessionUser = {
  role?: string;
};

export default function ContractsPage() {
  const { data: session } = useSession();
  const user = (session?.user ?? {}) as SessionUser;
  const normalizedRole = user.role?.toLowerCase();
  const roleView: UserRole =
    normalizedRole === "landlord" || normalizedRole === "admin" || normalizedRole === "student"
      ? normalizedRole
      : "student";

  const pageTitle = "Hợp đồng";
  const pageDescription =
    roleView === "student"
      ? "Xem, ký và theo dõi hợp đồng thuê của bạn."
      : "Quản lý, gửi và theo dõi hợp đồng thuê trên cùng một trang.";

  return (
    <UserPageShell
      title={pageTitle}
      description={pageDescription}
      eyebrow={pageTitle}
      actions={
        <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-white backdrop-blur">
          {roleView === "student" ? "Hợp đồng của tôi" : "Quản lý hợp đồng"}
        </span>
      }
    >
      <div className="space-y-6">
        <RentalContractsPanel roleView={roleView} />
        <RentalContractWorkspace roleView={roleView} />
      </div>
    </UserPageShell>
  );
}
