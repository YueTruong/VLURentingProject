import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import UserMenu from "@/app/_shared/navigation/UserMenu";
import DocumentUploadClient from "./DocumentUploadClient";

export default async function IdentityDocumentUploadPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/homepage");

  return (
    <div className="settings-standalone-shell min-h-screen bg-white text-[#222222]">
      <header className="border-b border-[#e5e7eb]">
        <div className="mx-auto flex h-[88px] w-full items-center justify-between px-6 lg:px-16">
          <Link href="/" className="inline-flex items-center">
            <Image
              src="/images/VLU-Renting-Logo.svg"
              alt="VLU Renting"
              width={140}
              height={52}
              className="object-contain"
              priority
            />
          </Link>

          <UserMenu variant="compact" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-[560px] bg-white px-6 py-8">
        <DocumentUploadClient />
      </main>
    </div>
  );
}
