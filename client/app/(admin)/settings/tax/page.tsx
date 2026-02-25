import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import type { ReactNode } from "react";

const TAX_UPDATE_URL = "/settings/tax/taxpayers?flow=VAT&country=VN";

type MenuItem = {
  label: string;
  href?: string;
  icon: ReactNode;
  active?: boolean;
};

function MenuIcon({ children }: { children: ReactNode }) {
  return <span className="inline-flex h-5 w-5 items-center justify-center text-[#222222]">{children}</span>;
}

function TaxActionBlock({
  title,
  description,
  buttonLabel,
  href,
}: {
  title: string;
  description: string;
  buttonLabel: string;
  href?: string;
}) {
  return (
    <section className="mt-10">
      <h2 className="text-[38px] font-semibold leading-[1.2] text-[#111827]">{title}</h2>
      <p className="mt-2 max-w-[780px] text-[14px] leading-7 text-[#4b5563]">{description}</p>
      {href ? (
        <Link href={href} className="mt-5 inline-flex rounded-xl bg-[#111827] px-6 py-3 text-[16px] font-semibold text-white">
          {buttonLabel}
        </Link>
      ) : (
        <button type="button" className="mt-5 rounded-xl bg-[#111827] px-6 py-3 text-[16px] font-semibold text-white">
          {buttonLabel}
        </button>
      )}
    </section>
  );
}

export default async function SettingsTaxPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/homepage");

  const menuItems: MenuItem[] = [
    {
      label: "Thông tin cá nhân",
      href: "/settings",
      icon: (
        <MenuIcon>
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 21a8 8 0 00-16 0" />
            <circle cx="12" cy="8" r="4" />
          </svg>
        </MenuIcon>
      ),
    },
    {
      label: "Đăng nhập và bảo mật",
      href: "/settings/password",
      icon: (
        <MenuIcon>
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 4v6c0 4.4-3 7-7 8-4-1-7-3.6-7-8V7l7-4z" />
          </svg>
        </MenuIcon>
      ),
    },
    {
      label: "Quyền riêng tư",
      icon: (
        <MenuIcon>
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v20M2 12h20" />
            <circle cx="12" cy="12" r="9" />
          </svg>
        </MenuIcon>
      ),
    },
    {
      label: "Thông báo",
      icon: (
        <MenuIcon>
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17H5l1.4-1.4A2 2 0 007 14.2V10a5 5 0 1110 0v4.2a2 2 0 00.6 1.4L19 17h-4z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19a3 3 0 006 0" />
          </svg>
        </MenuIcon>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-white text-[#222222]">
      <header className="border-b border-[#e5e7eb]">
        <div className="mx-auto flex h-[88px] w-full items-center justify-between px-6 lg:px-16">
          <Link href="/" className="inline-flex items-center">
            <Image src="/images/VLU-Renting-Logo.svg" alt="VLU Renting" width={140} height={52} className="object-contain" priority />
          </Link>
          <button className="rounded-full bg-[#efefef] px-6 py-2 text-[16px] font-semibold text-[#222222] hover:bg-[#e6e6e6]">Hoàn tất</button>
        </div>
      </header>

      <main className="grid min-h-[calc(100vh-88px)] grid-cols-1 lg:grid-cols-[480px_1fr]">
        <aside className="border-r border-[#e5e7eb] px-8 py-7 lg:px-16">
          <h1 className="text-[32px] font-semibold leading-[1.08]">Cài đặt tài khoản</h1>

          <div className="mt-6 space-y-1.5">
            {menuItems.map((item) => {
              const className = `flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-[15px] leading-6 transition ${
                item.active ? "bg-[#efefef] font-semibold" : "hover:bg-[#f7f7f7]"
              }`;

              if (item.href) {
                return (
                  <Link key={item.label} href={item.href} className={className}>
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                );
              }

              return (
                <button key={item.label} type="button" className={className}>
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="px-8 py-7 lg:px-16">
          <div className="mx-auto w-full max-w-[760px]">
            <h2 className="text-[36px] font-semibold leading-[1.1] text-[#111827]">Thuế</h2>

            <section className="mt-5 rounded-2xl border border-[#d1d5db] px-5 py-4">
              <div className="flex gap-3">
                <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#d97706] text-white">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v5m0 3h.01" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l10 18H2L12 3z" />
                  </svg>
                </span>
                <div>
                  <p className="text-[16px] font-semibold text-[#111827]">Cập nhật thông tin của bạn cho mục đích khấu trừ thuế</p>
                  <p className="mt-1 text-[14px] leading-6 text-[#4b5563]">
                    Thêm số đăng ký kinh doanh (ĐKKD) để đảm bảo không bị khấu trừ thuế đối với thu nhập từ hoạt động kinh doanh của bạn.
                  </p>
                  <Link href={TAX_UPDATE_URL} className="mt-2 inline-block text-[14px] font-semibold underline underline-offset-4">
                    Cập nhật thông tin thuế
                  </Link>
                </div>
              </div>
            </section>

            <div className="mt-7 border-b border-[#d1d5db]">
              <div className="flex items-end gap-8">
                <button type="button" className="border-b-2 border-[#111827] pb-3 text-[15px] font-semibold text-[#111827]">
                  Người nộp thuế
                </button>
                <button type="button" className="pb-3 text-[15px] text-[#6b7280]">
                  Chứng từ thuế
                </button>
                <button type="button" className="pb-3 text-[15px] text-[#6b7280]">
                  Khấu trừ thuế
                </button>
              </div>
            </div>

            <TaxActionBlock
              title="Thông tin người nộp thuế"
              description="Hầu hết các quốc gia/khu vực đều yêu cầu cung cấp thông tin thuế. Tìm hiểu thêm"
              buttonLabel="Thêm thông tin thuế"
              href={TAX_UPDATE_URL}
            />

            <TaxActionBlock
              title="Số đăng ký kinh doanh (ĐKKD)"
              description="Nếu bạn có số ĐKKD, hãy thêm thông tin này cho doanh nghiệp của bạn. Bạn chỉ có thể có một số ĐKKD hoặc mã số thuế GTGT tại một thời điểm. Tìm hiểu thêm"
              buttonLabel="Thêm số ĐKKD"
              href={TAX_UPDATE_URL}
            />

            <section className="mt-10 pb-6">
              <h2 className="text-[38px] font-semibold leading-[1.2] text-[#111827]">Bạn cần trợ giúp?</h2>
              <p className="mt-2 text-[14px] leading-7 text-[#4b5563]">
                Xem phần giải đáp cho các câu hỏi về thuế trong <span className="font-semibold underline underline-offset-4 text-[#111827]">Trung tâm trợ giúp</span> của chúng tôi.
              </p>
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}



