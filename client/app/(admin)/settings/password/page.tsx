import SettingsTabs from "../components/settingsTabs";

function CheckItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-500">
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-green-500 text-green-600">✓</span>
      <span>{text}</span>
    </div>
  );
}

export default function SettingsPasswordPage() {
  return (
    <div className="px-10 py-4">
      <h1 className="text-4xl font-bold text-gray-900">Cài đặt</h1>
      <p className="mt-2 text-gray-500">Quản lý thông tin tài khoản của bạn</p>

      <div className="mt-6 rounded-2xl border border-gray-200 bg-white">
        <SettingsTabs />

        <div className="px-10 py-10">
          <div className="max-w-2xl space-y-8">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900">Mật khẩu hiện tại</label>
              <input
                type="password"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập mật khẩu hiện tại"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900">Mật khẩu mới</label>
              <input
                type="password"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập mật khẩu mới"
              />

              <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="h-1 rounded-full bg-green-500" />
                <div className="h-1 rounded-full bg-green-500" />
                <div className="h-1 rounded-full bg-green-500" />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <CheckItem text="Ít nhất 8 ký tự" />
                <CheckItem text="Một chữ hoa" />
                <CheckItem text="Một số" />
                <CheckItem text="Một ký tự đặc biệt" />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900">Xác nhận mật khẩu mới</label>
              <input
                type="password"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Xác nhận mật khẩu mới"
              />
            </div>
          </div>

          <div className="mt-10 border-t border-gray-200" />

          <div className="mt-10 flex justify-end">
            <button className="rounded-xl bg-blue-500 px-10 py-4 font-bold text-white transition hover:bg-blue-700 active:scale-[0.99]">
              Cập nhật mật khẩu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
