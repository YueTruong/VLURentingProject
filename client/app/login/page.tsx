"use client"
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  {/* State dùng cho phần nhập mail test */}
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  
  {/* Hàm xử lý đăng nhập */}
  const handleTesterLogin = async () => {
    setError("");

    const res = await signIn("credentials", {
      redirect: false,
      username,
      password,
    });

    if (res?.ok) {
      router.push("/");
    } else {
      setError("Tài khoản hoặc mật khẩu không chính xác!");
    }
  };

  return(
    <div className="min-h-screen w-full flex items-center justify-center relative">

      {/* 1. BACKGROUND IMAGE */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/VLU_Campus.png"
          alt="VLU Campus"
          fill
          className="object-cover"
          priority // Load ảnh này ngay lập tức
        />
        {/* Lớp phủ đen mờ làm nổi bật cái bảng đăng nhập */}
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"></div>
      </div>

      {/* 2. LOGIN CARD */}
      <div className="
        relative z-10 bg-white
        w-full max-w-4xl mx-4
        rounded-2xl shadow-2xl overflow-hidden
        flex flex-col md:flex-row min-h-[450px]
      ">
        {/* CỘT TRÁI: LOGO */}
        <div className="w-full md:w-1/2 bg-white flex items-center justify-center p-8 border-b md:border-b-0 md:border-r border-gray-100">
          <div className="relative h-full md:w-64 md:h-32">
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

        {/* CỘT PHẢI: FORM ĐĂNG NHẬP */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white">
          
          <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
            Sign in with
          </h2>

          <div className="space-y-4">

            {/* BUTTON 1: MICROSOFT */}
            <div className="flex flex-col gap-3">
              <Link href="/">
                <button 
                onClick={() => signIn("azure-ad", {callbackUrl: "/" })}

                className="
                  w-full flex items-center jusitfy-start gap-4 px-6
                  h-14 rounded-lg border border-gray-300
                  hover:bg-gray-50 hover:border-gray-400 hover:shadow-md
                  transition-all duration-300 active:scale-95 group
                ">
                  <Image src="/icons/Microsoft.svg" alt="Microsoft" width={24} height={24} />
                  <span className="text-gray-600 font-medium group-hover:text-black">
                    Sign in with Microsoft
                  </span>
                </button>
              </Link>

              {/* BUTTON 2: GOOGLE */}
                <button 
                  onClick={() => signIn("google", { callbackUrl: "/loggedhomepage" })} // 1. Gọi hàm signIn thay vì Link
                  type="button"
                  className="
                    w-full flex items-center jusitfy-start gap-4 px-6
                    h-14 rounded-lg border border-gray-300
                    hover:bg-gray-50 hover:border-gray-400 hover:shadow-md
                    transition-all duration-300 active:scale-95 group
                ">
                  <Image src="/icons/Google.svg" alt="Google" width={24} height={24} />
                  <span className="text-gray-600 font-medium group-hover:text-black">
                    Sign in with Google Account
                  </span>
                </button>                     
            </div>

            {/* PHẦN TESTER */}
            <div className="pt-2">
              <div className="relative flex items-center py-2">
                <div className="grow border-t border-gray-200"></div>
                <span className="shrink-0 mx-4 text-gray-400 text-xs uppercase">Tester Option</span>
                <div className="grow border-t border-gray-200"></div>
              </div>

              <form 
                className="flex flex-col gap-4"
                onSubmit={(e) => {
                  e.preventDefault(); // Tránh việc reset page
                  handleTesterLogin();
                }}
              >
                <input
                  type="text"
                  placeholder="Test Username..."
                  className="flex-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <input
                  type="password"
                  placeholder="Test Password..."
                  className="flex-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />      

                {/* HIỂN THỊ DÒNG LỖI */}          
                {error && (
                  <p className="text-red-500 text-sm text-center font-medium animate-pulse">
                    ⚠️ {error}
                  </p>
                )}

                <button 
                  type="submit"
                  className="
                    w-full h-[42px]
                    bg-gray-800 hover:bg-black
                    text-white rounded-lg
                    text-sm font-bold uppercase tracking-wider
                    transition-all duration-300 active:scale-95
                    shadow-lg hover:shadow-xl
                  ">
                  Login
                </button>
              </form>
            </div>

          </div>

          {/* FOOTER TEXT */}
          <div className="mt-8 text-center md:text-left">
            <p className="text-[#D51F35] text-xs font-medium leading-relaxed">
              Trang web phục vụ mục đích tìm kiếm nhà trọ cho sinh viên Văng Lang.
              <br/>Vui lòng sử dụng tài khoản nhà trường để đăng nhập.
            </p>
          </div>

        </div>
      </div>

    </div>
  )
}