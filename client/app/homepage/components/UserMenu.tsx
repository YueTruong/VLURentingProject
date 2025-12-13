"use client";

import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";

export default function UserMenu() {
  const { data: session } = useSession();
  console.log("CHECK SESSION: ",session);
  const [isOpen, setIsOpen] = useState(false);
  
  // 1. Thêm Ref để xác định vùng menu
  const menuRef = useRef<HTMLDivElement>(null);

  // 2. Thêm logic: Bấm ra ngoài thì tự đóng menu (Fix lỗi import thừa useEffect)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!session) {
    return (
      null    
    );
  }

  const userImage = session.user?.image || "/images/Admins.png";

  return (
    // Gắn ref vào đây để bắt sự kiện click ra ngoài
    <div className="relative" ref={menuRef}> 
      
      {/* Nút Avatar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 border border-gray-300 rounded-full p-1 pl-3 hover:shadow-md transition active:scale-95"
      >

        <div className="w-8 h-8 relative rounded-full overflow-hidden border border-gray-200">
          <Image
            src={userImage}
            alt="Avatar"
            fill
            className="object-cover"
          />
        </div>

        <span className="text-sm font-semibold hidden md:block">
          {session.user?.name || "User"}
        </span>

        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-4 h-4 text-gray-500 mr-1 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
           <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Menu Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl py-2 border border-gray-100 z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-bold text-gray-900 truncate">{session.user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{session.user?.email}</p>
          </div>

          <Link 
            href="/profile" 
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => setIsOpen(false)} // Đóng menu khi bấm
          >
            Hồ sơ của tôi
          </Link>

          <button
            onClick={() => signOut({ callbackUrl: "/homepage" })}
            className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium"
          >
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}