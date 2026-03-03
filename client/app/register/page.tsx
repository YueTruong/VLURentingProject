"use client";

import { useState, FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    fullName: "",
    phoneNumber: "",
    role: "STUDENT", 
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleSelect = (selectedRole: "STUDENT" | "LANDLORD") => {
    setFormData((prev) => ({ ...prev, role: selectedRole }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.username || !formData.password || !formData.fullName || !formData.phoneNumber) {
      toast.error("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự!");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = Array.isArray(data.message) ? data.message[0] : data.message;
        throw new Error(errorMessage || "Đăng ký thất bại, vui lòng thử lại.");
      }

      toast.success("Đăng ký tài khoản thành công! Vui lòng đăng nhập.");
      setTimeout(() => { router.push("/login"); }, 1500);

    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Đã có lỗi xảy ra, vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative p-4">

      {/* 1. BACKGROUND IMAGE (Giống Login) */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/VLU_Campus.png"
          alt="VLU Campus"
          fill
          className="object-cover"
          priority // Load ảnh này ngay lập tức
        />
        {/* Lớp phủ đen mờ làm nổi bật cái bảng đăng ký */}
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"></div>
      </div>

      {/* 2. REGISTER CARD (Giống Layout Login) */}
      <div className="
        relative z-10 bg-white
        w-full max-w-4xl mx-auto
        rounded-2xl shadow-2xl overflow-hidden
        flex flex-col md:flex-row min-h-[450px]
      ">
        {/* CỘT TRÁI: LOGO */}
        <div className="w-full md:w-1/2 bg-white flex items-center justify-center p-8 border-b md:border-b-0 md:border-r border-gray-100 sm:flex">
          <div className="relative h-full w-full max-w-[280px] max-h-40 md:w-64 md:h-32 flex items-center justify-center">
            <Image
              src="/images/VLU_University.png"
              alt="Van Lang University"
              width={480}
              height={480}
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* CỘT PHẢI: FORM ĐĂNG KÝ */}
        <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col justify-center bg-white">
          
          <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center md:text-left">
            Tạo tài khoản mới
          </h2>
          <p className="text-sm text-gray-500 mb-6 text-center md:text-left">
            Đã có tài khoản?{" "}
            <Link href="/login" className="font-semibold text-(--brand-accent) hover:underline">
              Đăng nhập
            </Link>
          </p>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            
            {/* VAI TRÒ */}
            <div className="grid grid-cols-2 gap-3 mb-2">
              <button
                type="button"
                onClick={() => handleRoleSelect("STUDENT")}
                className={`flex items-center justify-center gap-2 rounded-lg border p-3 transition-all ${
                  formData.role === "STUDENT"
                    ? "border-[#d51f35] bg-red-50 text-[#d51f35] font-bold ring-1 ring-[#d51f35]"
                    : "border-gray-300 bg-transparent text-gray-500 hover:bg-gray-50 font-medium"
                }`}
              >
                🎓 Sinh viên
              </button>
              <button
                type="button"
                onClick={() => handleRoleSelect("LANDLORD")}
                className={`flex items-center justify-center gap-2 rounded-lg border p-3 transition-all ${
                  formData.role === "LANDLORD"
                    ? "border-[#d51f35] bg-red-50 text-[#d51f35] font-bold ring-1 ring-[#d51f35]"
                    : "border-gray-300 bg-transparent text-gray-500 hover:bg-gray-50 font-medium"
                }`}
              >
                🏠 Chủ trọ
              </button>
            </div>

            {/* HỌ VÀ TÊN & USERNAME */}
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Họ và tên..."
                className="flex-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none transition-all"
              />
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Tên đăng nhập..."
                className="flex-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none transition-all"
              />
            </div>

            {/* EMAIL */}
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email nhà trường (@vanlanguni.vn)..."
              className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none transition-all"
            />

            {/* SỐ ĐIỆN THOẠI */}
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="Số điện thoại..."
              className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none transition-all"
            />

            {/* MẬT KHẨU */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Mật khẩu..."
                className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 pr-10 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>

            {/* NÚT SUBMIT GIỐNG LOGIN */}
            <button 
              type="submit"
              disabled={loading}
              className="
                mt-2 w-full h-11 flex items-center justify-center
                bg-(--brand-accent) hover:bg-(--brand-accent-strong)
                text-white rounded-lg
                text-sm font-semibold
                transition-all duration-300 active:scale-95
                shadow-md hover:shadow-lg disabled:opacity-70 disabled:active:scale-100
              "
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang xử lý...
                </span>
              ) : (
                "Đăng ký"
              )}
            </button>

          </form>

          {/* FOOTER TEXT */}
          <div className="mt-6 text-center md:text-left">
            <p className="text-[#D51F35] text-[11px] font-medium leading-relaxed">
              * Khuyến nghị sử dụng tài khoản email nhà trường để được ưu tiên xác thực phòng trọ nhanh nhất.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}