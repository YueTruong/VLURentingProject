import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import UserMenu from "@/app/_shared/navigation/UserMenu";
import DocumentTypeClient from "./DocumentTypeClient";

export default async function IdentityDocumentTypePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/homepage");

  return (
    <div className="settings-standalone-shell min-h-screen bg-white text-[#222222]">
      <header className="border-b border-[#e5e7eb]">
        <div className="mx-auto flex h-[96px] w-full items-center justify-between px-6 lg:px-20">
          <Link href="/" className="inline-flex items-center">
            <Image src="/images/VLU-Renting-Logo.svg" alt="VLU Renting" width={156} height={58} className="object-contain" priority />
          </Link>

          <UserMenu variant="compact" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-[700px] px-6 py-10 sm:px-8">
        <DocumentTypeClient />
      </main>
    </div>
  );
}
