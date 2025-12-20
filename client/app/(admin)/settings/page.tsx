import SettingsTabs from "./components/settingsTabs";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function SettingsInfoPage() {
  const session = await getServerSession(authOptions);

  const userName = session?.user?.name ?? "";
  const userEmail = session?.user?.email ?? "";
  const userImage = session?.user?.image || "/images/Admins.png";

  if (!session) {
    redirect("/homepage");
  }

  return (
    <div className="px-10 py-8">
      <h1 className="text-4xl font-bold text-gray-900">Settings</h1>
      <p className="mt-2 text-gray-500">Quản lý thông tin tài khoản của bạn</p>

      <div className="mt-6 rounded-2xl border border-gray-200 bg-white">
        <SettingsTabs />

        <div className="px-10 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Left: Avatar */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Avatar</h2>

              <div className="mt-8 flex flex-col items-center">
                <div className="relative h-44 w-44 rounded-full overflow-hidden border border-gray-200">
                  <Image
                    src={userImage}
                    alt="Avatar"
                    fill
                    sizes="176px"
                    className="object-cover"
                    priority
                  />
                </div>
                <button
                  className="mt-6 rounded-xl border border-gray-300 px-6 py-3 text-sm font-semibold hover:bg-gray-50 active:scale-[0.99] transition"
                >
                  Tải ảnh lên
                </button>
              </div>
            </div>

            {/* Right: Form */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Tên hiển thị
                </label>
                <input
                  defaultValue={userName}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Email
                </label>
                <input
                  value={userEmail}
                  readOnly
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-400">
                  Email không thể thay đổi
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Giới tính
                </label>

                <div className="relative">
                  <select className="w-full appearance-none rounded-xl border border-gray-300 bg-white px-4 py-3 pr-12  text-gray-900 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  defaultValue="Nam"
                  >
                    <option className="bg-white txt-gray-900" value="Nam">Nam</option>
                    <option className="bg-white txt-gray-900" value="Nữ">Nữ</option>
                    <option className="bg-white txt-gray-900" value="Khác">Khác</option>
                  </select>

                  {/* Icon dropdown */}
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                    ▾
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-gray-200" />

          <div className="mt-10 flex justify-end">
            <button className="rounded-xl bg-blue-600 px-10 py-4 text-white font-bold hover:bg-blue-700 active:scale-[0.99] transition">
              Cập nhật
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
