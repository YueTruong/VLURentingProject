"use client";

import UserPageShell from "@/app/homepage/components/UserPageShell";

const policyBlocks = [
  {
    title: "Nguyên tắc cộng đồng",
    items: [
      "Tôn trọng, giao tiếp văn minh giữa người thuê và chủ trọ.",
      "Không phân biệt đối xử về giới tính, tôn giáo, vùng miền, nghề nghiệp.",
      "Ưu tiên minh bạch thông tin và hỗ trợ lẫn nhau.",
    ],
  },
  {
    title: "Nội dung bị cấm",
    items: [
      "Tin đăng sai sự thật, mập mờ, hoặc có yếu tố lừa đảo.",
      "Nội dung chứa quảng cáo rác, spam, hoặc liên kết độc hại.",
      "Yêu cầu trái pháp luật hoặc vi phạm chuẩn mực đạo đức.",
    ],
  },
  {
    title: "Chính sách xác minh chủ trọ",
    items: [
      "Chủ trọ có thể gửi CCCD/CMND và giấy tờ chứng minh quyền sở hữu.",
      "Hệ thống hiển thị huy hiệu đã xác minh sau khi hồ sơ được duyệt.",
      "Thời gian xử lý dự kiến 1-3 ngày làm việc.",
    ],
  },
  {
    title: "Vai trò trung gian của nền tảng",
    items: [
      "VLU Renting chỉ đóng vai trò kết nối giữa người thuê và chủ trọ.",
      "Thông tin hợp đồng và giao dịch được lưu để tham chiếu, không thay thế ký kết pháp lý.",
      "Trách nhiệm về tính chính xác và tranh chấp thuộc về bên cho thuê và người thuê.",
    ],
  },
  {
    title: "Quy định về ở ghép",
    items: [
      "Bài đăng ở ghép phải liên kết với phòng trọ gốc đang thuê.",
      "Người thuê tự đăng phải thông báo và được chủ trọ xác nhận trước khi hiển thị.",
      "Hệ thống quản lý số người ở và giới hạn tối đa theo phòng trọ gốc.",
    ],
  },
  {
    title: "Quy định hợp đồng thuê",
    items: [
      "Hợp đồng do chủ trọ soạn thảo và ký trực tiếp với người thuê.",
      "Hợp đồng gồm thông tin các bên, giá thuê, tiền cọc, chi phí dịch vụ và thời hạn.",
      "Điều kiện gia hạn, chấm dứt hợp đồng được ghi rõ theo thỏa thuận.",
    ],
  },
  {
    title: "Quy định tiền cọc",
    items: [
      "Ghi nhận số tiền cọc và điều kiện hoàn trả/mất cọc theo thỏa thuận.",
      "Trạng thái tiền cọc được cập nhật minh bạch giữa hai bên.",
      "VLU Renting chỉ lưu trữ thông tin để tham chiếu và hỗ trợ quản lý.",
    ],
  },
  {
    title: "Nhắc nhở gia hạn hợp đồng",
    items: [
      "Hệ thống có thể gửi nhắc nhở trước 15 hoặc 30 ngày trước khi hết hạn.",
      "Người thuê xác nhận gia hạn hoặc dọn đi để chủ trọ chủ động sắp xếp.",
      "Lịch nhắc nhở được điều chỉnh theo từng hợp đồng.",
    ],
  },
  {
    title: "Báo cáo và xử lý vi phạm",
    items: [
      "Người dùng có thể báo cáo tin đăng hoặc tài khoản đáng ngờ.",
      "Chúng tôi xem xét, ẩn tin hoặc khóa tài khoản khi có vi phạm.",
      "Tái phạm nhiều lần có thể bị cấm vĩnh viễn.",
    ],
  },
  {
    title: "Bảo vệ người thuê",
    items: [
      "Khuyến nghị xem phòng trực tiếp trước khi đặt cọc.",
      "Không chuyển tiền khi thông tin chủ trọ chưa được xác minh.",
      "Lưu lại tin nhắn và giấy tờ để hỗ trợ khiếu nại.",
    ],
  },
];

export default function UserPolicyPage() {
  return (
    <UserPageShell
      title="Chính sách người dùng tại Việt Nam"
      description="Bộ quy tắc giúp xây dựng cộng đồng thuê trọ an toàn, minh bạch và tuân thủ pháp luật."
      eyebrow="Chính sách"
      actions={
        <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white">
          Cập nhật: 01/2026
        </span>
      }
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Cam kết cộng đồng</h2>
          <p className="mt-2 text-sm text-gray-600">
            VLU Renting xây dựng quy tắc dựa trên tiêu chuẩn an toàn thông tin, Luật An ninh mạng 2018 và các
            quy định về bảo vệ người tiêu dùng tại Việt Nam.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              { label: "An toàn", desc: "Giảm rủi ro lừa đảo và tranh chấp." },
              { label: "Minh bạch", desc: "Thông tin rõ ràng, dễ xác minh." },
              { label: "Hợp tác", desc: "Hỗ trợ xử lý vi phạm nhanh chóng." },
              { label: "Tuân thủ", desc: "Đúng quy định pháp luật Việt Nam." },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="text-sm font-semibold text-gray-900">{item.label}</div>
                <div className="mt-1 text-xs text-gray-600">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4">
          {policyBlocks.map((block) => (
            <div key={block.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-base font-semibold text-gray-900">{block.title}</h3>
              <ul className="mt-3 space-y-2 text-sm text-gray-700">
                {block.items.map((item) => (
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
          Cần hỗ trợ thêm về chính sách? Vui lòng liên hệ{" "}
          <span className="font-semibold">support@vlu-renting.vn</span>.
        </div>
      </div>
    </UserPageShell>
  );
}
