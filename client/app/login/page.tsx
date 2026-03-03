"use client"
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  const handleTesterLogin = async () => {
    setError("");
    setLoading(true);
    
    try {
      const res = await signIn("credentials", {
        redirect: false,
        username,
        password,
      });

      if (res?.ok) {
        toast.success("Đăng nhập thành công!");
        router.push("/");
      } else {
        setError("Tài khoản hoặc mật khẩu không chính xác.");
      }
    } catch {
      setError("Đã có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return(
    <div className="min-h-screen w-full flex items-center justify-center relative p-4">

      {/* 1. BACKGROUND IMAGE */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/VLU_Campus.png"
          alt="VLU Campus"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"></div>
      </div>

      {/* 2. LOGIN CARD */}
      <div className="
        relative z-10 bg-white
        w-full max-w-4xl mx-auto
        rounded-2xl shadow-2xl shadow-black/50 overflow-hidden
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

        {/* CỘT PHẢI: FORM ĐĂNG NHẬP */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white">
          
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 text-center md:text-left">
              Đăng nhập
            </h2>
            <p className="mt-2 text-sm text-gray-500 text-center md:text-left">
              Chưa có tài khoản?{" "}
              <Link href="/register" className="font-semibold text-(--brand-accent) hover:underline">
                Đăng ký ngay
              </Link>
            </p>
          </div>

          <div className="space-y-4">

            {/* BUTTON 1: MICROSOFT */}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => signIn("azure-ad", { callbackUrl: "/" })}
                className={`
                  w-full flex items-center justify-center gap-4 px-6
                  h-12 rounded-xl border border-gray-300
                  transition-all duration-300 group
                  hover:bg-gray-50 hover:border-gray-400 hover:shadow-sm active:scale-[0.98]
                `}
              >
                <Image src="/icons/Microsoft.svg" alt="Microsoft" width={20} height={20} />
                <span className="font-medium text-sm text-gray-600 group-hover:text-black">
                  Đăng nhập với Microsoft
                </span>
              </button>

              {/* BUTTON 2: GOOGLE */}
              <button 
                onClick={() => signIn("google", { callbackUrl: "/" })}
                type="button"
                className="
                  w-full flex items-center justify-center gap-4 px-6
                  h-12 rounded-xl border border-gray-300
                  transition-all duration-300 group
                  hover:bg-gray-50 hover:border-gray-400 hover:shadow-sm active:scale-[0.98]
                "
              >
                <Image src="/icons/Google.svg" alt="Google" width={20} height={20} />
                <span className="font-medium text-sm text-gray-600 group-hover:text-black">
                  Đăng nhập với Google
                </span>
              </button>                    
            </div>

            {/* PHẦN TESTER */}
            <div className="pt-2">
              <div className="relative flex items-center py-2 mb-2">
                <div className="grow border-t border-gray-200"></div>
                <span className="shrink-0 mx-4 text-gray-400 text-xs uppercase font-medium">Hoặc đăng nhập theo cách</span>
                <div className="grow border-t border-gray-200"></div>
              </div>

              <form 
                className="flex flex-col gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleTesterLogin();
                }}
              >
                <input
                  type="text"
                  placeholder="Tên đăng nhập/Email nhà trường..."
                  className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-3 outline-none transition-all"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <input
                  type="password"
                  placeholder="Mật khẩu..."
                  className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-3 outline-none transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />      

                {/* HIỂN THỊ DÒNG LỖI */}          
                {error && (
                  <p className="text-red-500 text-xs text-center font-medium animate-pulse mt-1">
                    ⚠️ {error}
                  </p>
                )}

                <button 
                  type="submit"
                  disabled={loading}
                  className="
                    mt-1 w-full h-11 flex items-center justify-center
                    bg-(--brand-accent) hover:bg-(--brand-accent-strong)
                    text-white rounded-lg
                    text-sm font-bold tracking-wide
                    transition-all duration-300 active:scale-[0.98]
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
                    "Đăng nhập"
                  )}
                </button>
              </form>
            </div>

          </div>

          {/* FOOTER TEXT */}
          <div className="mt-8 text-center md:text-left">
            <p className="text-[#D51F35] text-[11px] font-medium leading-relaxed">
              * Hệ thống ưu tiên xác thực phòng trọ dành cho sinh viên trường Đại học Văn Lang.
            </p>
          </div>

        </div>
      </div>

    </div>
  )
}