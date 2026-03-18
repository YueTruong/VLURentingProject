import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import UserMenu from "@/app/_shared/navigation/UserMenu";
import CaptureMethodClient from "./CaptureMethodClient";

export default async function IdentityCaptureMethodPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/homepage");

  return (
    <div className="settings-standalone-shell min-h-screen bg-white text-[#222222]">
      <header className="border-b border-[#e5e7eb]">
        <div className="mx-auto flex h-[88px] w-full items-center justify-between px-6 lg:px-16">
          <Link href="/" className="inline-flex items-center">
            <Image src="/images/VLU-Renting-Logo.svg" alt="VLU Renting" width={140} height={52} className="object-contain" priority />
          </Link>

          <UserMenu variant="compact" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-[700px] px-6 py-8 lg:px-12">
        <h1 className="max-w-[620px] text-[32px] font-semibold leading-[1.2] text-[#111827]">
          Bạn muốn thêm giấy tờ tùy thân do chính phủ cấp của mình theo cách nào?
        </h1>

        <CaptureMethodClient />
      </main>
    </div>
  );
}
