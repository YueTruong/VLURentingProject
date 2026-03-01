import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import UserMenu from "@/app/homepage/components/UserMenu";

export default async function SettingsIdentityPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/homepage");

  return (
    <div className="min-h-screen bg-white text-[#222222]">
      <header className="border-b border-[#e5e7eb]">
        <div className="mx-auto flex h-[88px] w-full items-center justify-between px-6 lg:px-16">
          <Link href="/" className="inline-flex items-center">
            <Image src="/images/VLU-Renting-Logo.svg" alt="VLU Renting" width={140} height={52} className="object-contain" priority />
          </Link>

          <UserMenu variant="compact" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1180px] px-6 py-8 lg:px-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <section>
            <h1 className="max-w-[620px] text-[34px] font-semibold leading-[1.2] text-[#111827]">Hãy thêm giấy tờ tùy thân do chính phủ cấp</h1>

            <p className="mt-4 max-w-[620px] text-[14px] leading-7 text-[#4b5563]">
              Chúng tôi cần bạn bổ sung giấy tờ tùy thân chính thức do chính phủ cấp. Bước này giúp xác minh danh tính của bạn.
            </p>
            <p className="mt-3 max-w-[620px] text-[14px] leading-7 text-[#4b5563]">
              Bạn có thể thêm bằng lái xe, hộ chiếu hoặc chứng minh nhân dân/thẻ căn cước công dân tùy thuộc vào quốc gia quê quán của mình.
            </p>

            <div className="mt-10 max-w-[620px] border-t border-[#d1d5db] pt-4">
              <Link href="/settings/identity/capture-method" className="inline-flex rounded-xl bg-[#111827] px-5 py-2.5 text-[15px] font-semibold text-white">
                Thêm giấy tờ tùy thân
              </Link>
            </div>
          </section>

          <aside className="h-fit rounded-2xl border border-[#d1d5db] px-6 py-6">
            <p className="text-[24px] font-semibold text-[#111827]">Quyền riêng tư của bạn</p>
            <p className="mt-3 text-[14px] leading-7 text-[#4b5563]">
              Chúng tôi muốn đảm bảo sự riêng tư, an toàn và bảo mật cho dữ liệu bạn chia sẻ trong quá trình này. Tìm hiểu thêm trong
              <Link href="/user-policy" className="ml-1 font-semibold underline underline-offset-4 hover:text-[#111827]">
                Chính sách quyền riêng tư
              </Link>{" "}
              của chúng tôi.
            </p>
            <Link href="/user-policy#quy-trinh-xac-minh-danh-tinh" className="mt-4 inline-block text-[15px] font-semibold text-[#111827] underline underline-offset-4">
              Quy trình xác minh danh tính
            </Link>
          </aside>
        </div>
      </main>
    </div>
  );
}
