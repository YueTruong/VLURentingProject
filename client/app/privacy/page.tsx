"use client";

import UserPageShell from "@/app/homepage/components/UserPageShell";

const sections = [
  {
    title: "1. Dữ liệu chúng tôi thu thập",
    items: [
      "Thông tin tài khoản: họ tên, email, số điện thoại, ảnh đại diện.",
      "Thông tin tin đăng: mô tả phòng, giá, địa chỉ, hình ảnh, tiện ích.",
      "Dữ liệu giao dịch: lịch xem phòng, tin nhắn, lịch sử yêu cầu.",
      "Dữ liệu kỹ thuật: địa chỉ IP, thiết bị, log hệ thống, cookie.",
    ],
  },
  {
    title: "2. Mục đích xử lý dữ liệu",
    items: [
      "Xác thực tài khoản, cung cấp và vận hành dịch vụ.",
      "Gợi ý tin đăng phù hợp, hỗ trợ kết nối giữa người thuê và chủ trọ.",
      "Phòng chống gian lận, đảm bảo an toàn hệ thống.",
      "Thực hiện nghĩa vụ theo yêu cầu pháp luật Việt Nam.",
    ],
  },
  {
    title: "3. Cơ sở xử lý",
    items: [
      "Sự đồng ý của chủ thể dữ liệu (khi đăng ký hoặc sử dụng tính năng).",
      "Thực hiện hợp đồng, giao dịch và hỗ trợ người dùng.",
      "Nghĩa vụ pháp lý hoặc yêu cầu từ cơ quan có thẩm quyền.",
    ],
  },
  {
    title: "4. Chia sẻ dữ liệu",
    items: [
      "Chia sẻ với bên cho thuê/người thuê để hoàn thành giao dịch.",
      "Nhà cung cấp dịch vụ kỹ thuật (lưu trữ, gửi thông báo) theo hợp đồng bảo mật.",
      "Cơ quan chức năng khi có yêu cầu hợp pháp.",
    ],
  },
  {
    title: "5. Lưu trữ và bảo mật",
    items: [
      "Dữ liệu được lưu trữ trong thời gian cần thiết cho mục đích sử dụng.",
      "Áp dụng các biện pháp kiểm soát truy cập, mã hóa và sao lưu định kỳ.",
      "Người dùng có trách nhiệm bảo mật thông tin đăng nhập.",
    ],
  },
  {
    title: "6. Quyền của chủ thể dữ liệu",
    items: [
      "Quyền được biết, đồng ý hoặc rút lại sự đồng ý.",
      "Quyền truy cập, chỉnh sửa, xóa dữ liệu cá nhân.",
      "Quyền hạn chế xử lý, phản đối hoặc khiếu nại.",
    ],
  },
  {
    title: "7. Chuyển dữ liệu ra nước ngoài (nếu có)",
    items: [
      "Việc chuyển dữ liệu (nếu phát sinh) tuân thủ Nghị định 13/2023/NĐ-CP.",
      "Chỉ chuyển khi có biện pháp bảo vệ phù hợp và thông báo cần thiết.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <UserPageShell
      title="Chính sách bảo mật"
      description="Chúng tôi tôn trọng và bảo vệ dữ liệu cá nhân của người dùng theo quy định tại Việt Nam."
      eyebrow="Bảo mật"
      actions={
        <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white">
          Áp dụng: 01/2026
        </span>
      }
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Cam kết của chúng tôi</h2>
          <p className="mt-2 text-sm text-gray-600">
            VLU Renting tuân thủ Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân và các quy định liên quan.
            Chúng tôi chỉ xử lý dữ liệu cần thiết và minh bạch về mục đích sử dụng.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {["Minh bạch", "An toàn dữ liệu", "Tôn trọng quyền riêng tư"].map((label) => (
              <span
                key={label}
                className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700"
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-4">
          {sections.map((section) => (
            <div key={section.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-base font-semibold text-gray-900">{section.title}</h3>
              <ul className="mt-3 space-y-2 text-sm text-gray-700">
                {section.items.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-[#D51F35]" />
                    <span className="flex-1">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600">
          Nếu bạn có yêu cầu về dữ liệu cá nhân, vui lòng gửi email đến{" "}
          <span className="font-semibold">privacy@vlu-renting.vn</span>.
        </div>
      </div>
    </UserPageShell>
  );
}
