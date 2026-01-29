"use client";

import UserPageShell from "@/app/homepage/components/UserPageShell";

const sections = [
  {
    title: "1. Phạm vi áp dụng",
    items: [
      "Điều khoản này điều chỉnh việc truy cập và sử dụng nền tảng VLU Renting tại Việt Nam.",
      "Bằng việc tạo tài khoản hoặc sử dụng dịch vụ, bạn xác nhận đã đọc, hiểu và đồng ý.",
      "Chúng tôi có thể cập nhật điều khoản theo thời gian và sẽ thông báo trên nền tảng.",
    ],
  },
  {
    title: "2. Tài khoản và thông tin người dùng",
    items: [
      "Bạn cam kết cung cấp thông tin chính xác, đầy đủ và cập nhật.",
      "Bạn tự chịu trách nhiệm bảo mật tài khoản, mật khẩu và hoạt động phát sinh.",
      "Không được mạo danh hoặc sử dụng thông tin của bên thứ ba khi chưa có quyền.",
    ],
  },
  {
    title: "3. Đăng tin và nội dung",
    items: [
      "Tin đăng phải phản ánh đúng tình trạng phòng, giá, diện tích, điều kiện thuê.",
      "Không đăng nội dung lừa đảo, gây hiểu nhầm, vi phạm pháp luật, phân biệt đối xử.",
      "VLU Renting có quyền gỡ bỏ nội dung vi phạm hoặc yêu cầu bổ sung chứng cứ.",
    ],
  },
  {
    title: "4. Giao dịch và đặt cọc",
    items: [
      "VLU Renting là nền tảng kết nối, không phải bên ký kết hợp đồng thuê.",
      "Người dùng tự thỏa thuận về giá, cọc, thời hạn và điều kiện thuê.",
      "Khuyến nghị kiểm tra pháp lý, giấy tờ chủ nhà trước khi giao dịch.",
    ],
  },
  {
    title: "5. Hợp đồng điện tử",
    items: [
      "Tính năng ký hợp đồng điện tử là tiện ích hỗ trợ giao dịch.",
      "Dữ liệu ký, nhật ký thao tác có thể được lưu để đối soát khi cần.",
      "Việc sử dụng chữ ký điện tử tuân thủ quy định pháp luật Việt Nam.",
    ],
  },
  {
    title: "6. Quyền và trách nhiệm của VLU Renting",
    items: [
      "Duy trì và cải thiện dịch vụ, bảo vệ an toàn hệ thống.",
      "Từ chối hoặc chấm dứt dịch vụ đối với tài khoản vi phạm.",
      "Hợp tác với cơ quan chức năng khi có yêu cầu hợp pháp.",
    ],
  },
  {
    title: "7. Giới hạn trách nhiệm",
    items: [
      "Chúng tôi không chịu trách nhiệm cho tranh chấp phát sinh giữa người thuê và chủ trọ.",
      "Nền tảng cung cấp thông tin và công cụ hỗ trợ, không đảm bảo kết quả giao dịch.",
      "Bồi thường (nếu có) được giới hạn theo phạm vi pháp luật cho phép.",
    ],
  },
  {
    title: "8. Luật áp dụng và giải quyết tranh chấp",
    items: [
      "Điều khoản này được điều chỉnh bởi pháp luật Việt Nam.",
      "Tranh chấp sẽ được ưu tiên giải quyết bằng thương lượng.",
      "Nếu không thể thỏa thuận, tranh chấp được giải quyết tại cơ quan có thẩm quyền.",
    ],
  },
];

export default function TermsPage() {
  return (
    <UserPageShell
      title="Điều khoản sử dụng"
      description="Khung pháp lý cơ bản khi bạn sử dụng nền tảng VLU Renting tại Việt Nam."
      eyebrow="Pháp lý"
      actions={
        <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white">
          Cập nhật: 01/2026
        </span>
      }
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Tóm tắt nhanh</h2>
          <p className="mt-2 text-sm text-gray-600">
            VLU Renting là nền tảng kết nối người thuê và chủ trọ. Việc đăng tin, giao dịch và ký kết hợp
            đồng tuân theo pháp luật Việt Nam và các nguyên tắc minh bạch, trung thực.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {[
              { label: "Minh bạch", desc: "Thông tin chính xác, không gây hiểu nhầm." },
              { label: "Tự chịu trách nhiệm", desc: "Người dùng tự thỏa thuận điều kiện thuê." },
              { label: "Tuân thủ pháp luật", desc: "Theo luật hiện hành tại Việt Nam." },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="text-sm font-semibold text-gray-900">{item.label}</div>
                <div className="mt-1 text-xs text-gray-600">{item.desc}</div>
              </div>
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
          Khi cần hỗ trợ pháp lý hoặc khiếu nại, vui lòng liên hệ <span className="font-semibold">support@vlu-renting.vn</span>
          . Điều khoản này tham chiếu các quy định liên quan như Luật An ninh mạng 2018 và Luật Giao dịch điện tử
          2023.
        </div>
      </div>
    </UserPageShell>
  );
}
