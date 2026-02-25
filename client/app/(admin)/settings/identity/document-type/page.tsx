import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import DocumentTypeClient from "./DocumentTypeClient";

export default async function IdentityDocumentTypePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/homepage");

  return (
    <div className="min-h-screen bg-white text-[#222222]">
      <header className="border-b border-[#e5e7eb]">
        <div className="mx-auto flex h-[96px] w-full items-center justify-between px-6 lg:px-20">
          <Link href="/" className="inline-flex items-center">
            <Image src="/images/VLU-Renting-Logo.svg" alt="VLU Renting" width={156} height={58} className="object-contain" priority />
          </Link>

          <div className="flex items-center gap-4">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#111827] text-[15px] font-semibold text-white">H</span>
            <button type="button" aria-label="Menu" className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#efefef] text-[#111827]">
              <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[700px] px-6 py-10 sm:px-8">
        <DocumentTypeClient />
      </main>
    </div>
  );
}
