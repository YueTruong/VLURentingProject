"use client";

import Image from "next/image";
import { Suspense, useEffect, useState, useRef, FormEvent, useMemo, useCallback, ChangeEvent } from "react";
import io, { Socket } from "socket.io-client";
import { useSession } from "next-auth/react";
import UserTopBar from "@/app/homepage/components/UserTopBar";
import { uploadImages } from "@/app/services/posts";
import { useSearchParams, useRouter } from 'next/navigation';

import {
  ImageIcon,
  InfoCircledIcon,
  MagnifyingGlassIcon,
  PaperPlaneIcon,
  Pencil2Icon,
  Cross2Icon,
  PersonIcon,
  EnvelopeClosedIcon
} from "@radix-ui/react-icons";

// --- CẤU HÌNH ---
const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
const IMAGE_PREFIX = "[[image]]";
const CHAT_PROFILE_PREVIEW_KEY = "vlu.chat.profile.preview";

// --- UTILS FORMAT THỜI GIAN CHUẨN ---
const parseSafeDate = (dateString?: string) => {
  if (!dateString) return null;
  let safeString = dateString.replace(' ', 'T');
  if (!safeString.endsWith('Z') && !safeString.match(/[+-]\d\d:?\d\d$/)) {
    safeString += 'Z';
  }
  const date = new Date(safeString);
  if (isNaN(date.getTime())) return null;
  date.setHours(date.getHours() + 7);
  const now = new Date();
  if (date.getTime() > now.getTime()) {
    return now;
  }
  return date;
};

const formatTime = (dateString?: string) => {
  const date = parseSafeDate(dateString);
  if (!date) return "";
  return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false });
};

const formatRelativeTime = (dateString?: string) => {
  const date = parseSafeDate(dateString);
  if (!date) return "";
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayDiff = Math.floor((today.getTime() - targetDay.getTime()) / (1000 * 60 * 60 * 24));

  if (dayDiff === 0) return formatTime(dateString);
  else if (dayDiff === 1) return "Hôm qua";
  else if (dayDiff > 1 && dayDiff <= 7) return `${dayDiff} ngày trước`;
  else return date.toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit' });
};

const splitMessageContent = (content: string) => {
  const raw = (content || "").trim();
  if (!raw.startsWith(IMAGE_PREFIX)) {
    return { imageUrl: null as string | null, text: content };
  }
  const payload = raw.slice(IMAGE_PREFIX.length);
  const [urlLine, ...textLines] = payload.split("\n");
  return { imageUrl: urlLine?.trim() || null, text: textLines.join("\n").trim() };
};

const buildMessageContent = (text: string, imageUrl: string | null) => {
  const normalizedText = text.trim();
  if (!imageUrl) return normalizedText;
  if (!normalizedText) return `${IMAGE_PREFIX}${imageUrl}`;
  return `${IMAGE_PREFIX}${imageUrl}\n${normalizedText}`;
};

const getMessagePreview = (content: string) => {
  const { imageUrl, text } = splitMessageContent(content);
  if (imageUrl && text) return `Hình ảnh: ${text}`;
  if (imageUrl) return "Hình ảnh";
  const normalized = (text || "").trim();
  return normalized || "Chưa có tin nhắn";
};

// --- TYPES ---
type User = {
  id: number;
  email: string;
  full_name?: string;
  avatar_url?: string;
  phone_number?: string;
  profile?: {
    full_name?: string;
    avatar_url?: string;
    phone_number?: string;
  };
};

interface RawConversation {
  id: number;
  student: User;
  landlord: User;
  messages: Message[];
  created_at: string; 
  updated_at?: string;
}

type Conversation = {
  id: number;
  student: User;
  landlord: User;
  display_name: string; 
  display_avatar: string;
  last_message: string;
  last_time?: string;
  partner: User;
};

type Message = {
  id: number;
  conversation: { id: number };
  sender: { id: number };
  content: string;
  created_at: string;
};

// --- COMPONENTS ---

function UserProfileModal({ user, onClose, isOnline, onViewProfile, role }: { user: User; onClose: () => void; isOnline: boolean; onViewProfile: () => void; role: string; }) {
  const normalizedRole = role.trim().toLowerCase();
  const roleBadgeClassName = normalizedRole.includes("admin")
    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
    : normalizedRole.includes("sinh")
      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-sm rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl transition-colors dark:border-gray-800 dark:bg-gray-900">
        <div className="flex justify-end">
          <button onClick={onClose} className="rounded-full p-1 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition">
            <Cross2Icon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="flex flex-col items-center gap-3">
          <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-gray-100 shadow-lg dark:border-gray-800 dark:bg-gray-800">
            {user.avatar_url ? (
              <Image src={user.avatar_url} alt="Avatar" fill className="object-cover" unoptimized />
            ) : (
              <span className="text-4xl font-bold text-gray-400 dark:text-gray-500">{user.full_name?.charAt(0).toUpperCase() || "U"}</span>
            )}
            {isOnline && (
              <span className="absolute bottom-1 right-1 h-5 w-5 rounded-full border-4 border-white bg-green-500 dark:border-gray-800"></span>
            )}
          </div>
          
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user.full_name || "Người dùng ẩn danh"}</h2>
            <span className={`inline-block mt-1 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider ${roleBadgeClassName}`}>
              {role}
            </span>
            <p className={`text-sm font-medium mt-2 ${isOnline ? "text-green-600" : "text-gray-500 dark:text-gray-400"}`}>
              {isOnline ? "Đang hoạt động" : "Ngoại tuyến"}
            </p>
          </div>
          
          <div className="w-full space-y-3 mt-4">
            <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800/50">
              <EnvelopeClosedIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Email</p>
                <p className="text-sm truncate text-gray-700 dark:text-gray-300">{user.email || "Đang cập nhật..."}</p>
              </div>
            </div>
            {user.phone_number && (
                <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800/50">
                <PersonIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Số điện thoại</p>
                    <p className="text-sm font-semibold truncate text-gray-900 dark:text-white">{user.phone_number}</p>
                </div>
                </div>
            )}
          </div>

          <button
            type="button"
            onClick={onViewProfile}
            className="mt-4 w-full rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 active:scale-95 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Xem trang cá nhân
          </button>
        </div>
      </div>
    </div>
  );
}

function ConversationItem({ convo, active, onSelect, isOnline }: { convo: Conversation; active: boolean; onSelect: () => void; isOnline: boolean }) {
  const containerClass = active 
    ? "border-l-4 border-[#d51f35] bg-red-50/50 shadow-sm dark:border-red-500 dark:bg-red-900/10" 
    : "border-l-4 border-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50";

  return (
    <button
      onClick={onSelect}
      className={`group flex w-full items-center gap-3 p-3 transition-colors duration-200 ${containerClass}`}
    >
      <div className="relative h-12 w-12 shrink-0">
        <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gray-100 text-lg font-bold text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
            {convo.display_avatar ? (
                <Image src={convo.display_avatar} alt="Avatar" fill className="object-cover" unoptimized />
            ) : (
                <span>{convo.display_name?.charAt(0).toUpperCase()}</span>
            )}
        </div>
        {isOnline && (
            <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500 dark:border-gray-900"></span>
        )}
      </div>
      
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between mb-0.5">
          <p className={`text-sm truncate ${active ? "font-bold text-gray-900 dark:text-white" : "font-semibold text-gray-700 dark:text-gray-300"}`}>
            {convo.display_name}
          </p>
          <span className={`text-[10px] whitespace-nowrap ${active ? "font-semibold text-[#d51f35] dark:text-red-400" : "text-gray-500 dark:text-gray-500"}`}>
            {formatRelativeTime(convo.last_time)}
          </span>
        </div>
        <p className={`text-xs truncate ${active ? "font-medium text-gray-800 dark:text-gray-300" : "text-gray-500 dark:text-gray-500"}`}>
          {getMessagePreview(convo.last_message)}
        </p>
      </div>
    </button>
  );
}

function MessageBubble({ msg, isMe }: { msg: Message; isMe: boolean }) {
  const timeStr = formatTime(msg.created_at);
  const { imageUrl, text } = splitMessageContent(msg.content);

  return (
    <div className={`flex items-end gap-2 mb-4 group ${isMe ? "justify-end" : "justify-start"}`}>
      {!isMe && (
         <div className="mb-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[10px] font-bold text-gray-500 shadow-sm dark:bg-gray-800 dark:text-gray-400">
             Bot
         </div>
      )}
      
      <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[75%]`}>
        <div
            className={`px-4 py-2.5 text-[15px] shadow-sm leading-relaxed whitespace-pre-wrap wrap-break-word ${
            isMe 
                ? "bg-[#d51f35] text-white rounded-2xl rounded-br-sm" 
                : "rounded-2xl rounded-bl-sm border border-gray-200 bg-white text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
            }`}
        >
            {imageUrl ? (
              <a href={imageUrl} target="_blank" rel="noreferrer" className="mb-2 block overflow-hidden rounded-xl border border-white/20">
                <Image src={imageUrl} alt="Ảnh đính kèm" width={320} height={320} unoptimized className="h-auto w-full object-cover" />
              </a>
            ) : null}
            {text ? <span>{text}</span> : null}
        </div>
        <span className={`text-[10px] mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 select-none ${isMe ? "text-right text-gray-400 dark:text-gray-500" : "text-gray-400 dark:text-gray-500"}`}>
            {timeStr}
        </span>
      </div>
    </div>
  );
}

// --- MAIN PAGE ---

function ChatPageContent() {
  const { data: session } = useSession();
  const currentUserId = session?.user ? Number(session.user.id) : null;
  const accessToken = session?.user?.accessToken;

  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputVal, setInputVal] = useState("");
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<number[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  // ✅ FIX: SỬ DỤNG useRef ĐỂ LƯU TRỮ SOCKET INSTANCE THAY VÌ BIẾN TOÀN CỤC
  const socketRef = useRef<Socket | null>(null);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const partnerIdFromUrl = searchParams.get('partnerId');

  const mapConversation = useCallback((c: RawConversation): Conversation => {
    const rawPartner = c.student.id === currentUserId ? c.landlord : c.student;
    const partnerProfile = rawPartner.profile || {};
    
    const otherUser = {
      ...rawPartner,
      full_name: rawPartner.full_name || partnerProfile.full_name || rawPartner.email,
      avatar_url: rawPartner.avatar_url || partnerProfile.avatar_url || "",
      phone_number: rawPartner.phone_number || partnerProfile.phone_number || "",
    };
    
    let lastMsg = "";
    let lastTime = c.created_at || ""; 
    
    if (c.messages && c.messages.length > 0) {
        const last = c.messages[c.messages.length - 1];
        lastMsg = last.content;
        lastTime = last.created_at;
    }

    return {
        id: c.id, 
        student: c.student, 
        landlord: c.landlord,
        display_name: otherUser.full_name || "Người dùng",
        display_avatar: otherUser.avatar_url || "", 
        last_message: lastMsg, 
        last_time: lastTime, 
        partner: otherUser
    };
  }, [currentUserId]);

  // 1. Initial Load & Khởi tạo Socket
  useEffect(() => {
    if (!currentUserId || !accessToken) return;

    // Load danh sách chat ban đầu
    fetch(`${SOCKET_URL}/chat/my-conversations`, {
        headers: { Authorization: `Bearer ${accessToken}` }
    })
    .then(res => res.ok ? res.json() : [])
    .then(async (data: RawConversation[]) => {
        if (!Array.isArray(data)) return;
        const mapped = data.map(mapConversation);
        
        let targetId = null;
        if (partnerIdFromUrl) {
            const pId = Number(partnerIdFromUrl);
            const exist = mapped.find(c => c.student.id === pId || c.landlord.id === pId);
            if (exist) targetId = exist.id;
            else {
                try {
                    const initRes = await fetch(`${SOCKET_URL}/chat/init`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
                        body: JSON.stringify({ partnerId: pId })
                    });
                    const newRaw = await initRes.json();
                    const newConvo = mapConversation(newRaw);
                    mapped.unshift(newConvo); 
                    targetId = newConvo.id;
                } catch(e) { console.error(e); }
            }
        }
        setConversations(mapped);
        setSelectedId(targetId ?? (mapped.length > 0 ? mapped[0].id : null));
        if (targetId) router.replace('/chat');
    }).catch(console.error);

    // ✅ KHỞI TẠO SOCKET QUA useRef (Ngăn chặn lỗi Multiple Connections)
    if (!socketRef.current) {
        socketRef.current = io(SOCKET_URL);
    }
    
    const socket = socketRef.current;
    
    socket.emit("user_connected", currentUserId);

    socket.on("user_online", (userId: number) => {
      setOnlineUsers(prev => prev.includes(userId) ? prev : [...prev, userId]);
    });

    socket.on("user_offline", (userId: number) => {
      setOnlineUsers(prev => prev.filter(id => id !== userId));
    });

    socket.on("online_status_result", (data: { userId: number, isOnline: boolean }) => {
      if (data.isOnline) {
        setOnlineUsers(prev => prev.includes(data.userId) ? prev : [...prev, data.userId]);
      } else {
        setOnlineUsers(prev => prev.filter(id => id !== data.userId));
      }
    });

    socket.on("new_message", (newMsg: Message) => {
        if (!newMsg.created_at) newMsg.created_at = new Date().toISOString();
        
        setConversations(prev => {
            const index = prev.findIndex(c => c.id === newMsg.conversation.id);
            if (index === -1) return prev;
            const newArr = [...prev];
            const updatedConvo = { ...newArr[index], last_message: newMsg.content, last_time: newMsg.created_at };
            newArr.splice(index, 1);
            newArr.unshift(updatedConvo); // Đẩy lên đầu danh sách
            return newArr;
        });

        // ✅ FIX: Bắt sự kiện new_message vào box chat hiện tại ngay trong cục Socket Init
        setMessages((prevMsgs) => {
            // Chỉ thêm tin nhắn nếu nó thuộc về cuộc hội thoại đang được mở
            if (prevMsgs.length > 0 && prevMsgs[0].conversation.id === newMsg.conversation.id) {
                 return [...prevMsgs, newMsg];
            }
            return prevMsgs;
        });
        
        setTimeout(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, 100);
    });

    return () => { 
      socket.disconnect(); 
      socketRef.current = null;
    };
  }, [currentUserId, accessToken, partnerIdFromUrl, mapConversation, router]);

  // Fetch Messages khi đổi người chat
  useEffect(() => {
      if (!selectedId || !accessToken) return;
      
      const currentConv = conversations.find(c => c.id === selectedId);
      
      if (socketRef.current) {
        socketRef.current.emit("join_conversation", selectedId);
        if (currentConv) {
          socketRef.current.emit("check_online_status", currentConv.partner.id);
        }
      }

      fetch(`${SOCKET_URL}/chat/${selectedId}/messages`, {
          headers: { Authorization: `Bearer ${accessToken}` }
      })
      .then(res => res.json())
      .then(data => {
          if (Array.isArray(data)) setMessages(data);
      })
      .catch(console.error);
  }, [selectedId, accessToken, conversations]);

  useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages]);

  useEffect(() => {
    setPendingImageUrl(null);
    setUploadError("");
    if (imageInputRef.current) imageInputRef.current.value = "";
  }, [selectedId]);

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError("");
    if (!file.type.startsWith("image/")) {
      setUploadError("Chỉ hỗ trợ tệp hình ảnh.");
      event.target.value = "";
      return;
    }

    setIsUploadingImage(true);
    try {
      const uploaded = await uploadImages([file]);
      const firstUrl = uploaded[0];
      if (!firstUrl) setUploadError("Tải ảnh thất bại. Vui lòng thử lại.");
      else setPendingImageUrl(firstUrl);
    } catch {
      setUploadError("Tải ảnh thất bại. Vui lòng thử lại.");
    } finally {
      setIsUploadingImage(false);
      event.target.value = "";
    }
  };

  const handleSend = (e: FormEvent) => {
      e.preventDefault();
      if ((!inputVal.trim() && !pendingImageUrl) || !selectedId || !currentUserId || isUploadingImage) return;

      if (!socketRef.current) {
          console.error("Socket not connected");
          return;
      }

      const payload = {
          conversationId: selectedId,
          senderId: currentUserId,
          content: buildMessageContent(inputVal, pendingImageUrl)
      };
      
      // ✅ Gọi lệnh Emit thông qua socketRef
      socketRef.current.emit("send_message", payload);
      
      setInputVal("");
      setPendingImageUrl(null);
      setUploadError("");
  };

  const filteredConversations = useMemo(() => {
      if (!searchTerm) return conversations;
      return conversations.filter(c => 
          c.display_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [conversations, searchTerm]);

  const currentConv = conversations.find(c => c.id === selectedId);
  const isCurrentPartnerOnline = currentConv ? onlineUsers.includes(currentConv.partner.id) : false;

  const handleViewPartnerProfile = useCallback(() => {
    if (!currentConv) return;
    const partnerRole = currentConv.partner.id === currentConv.landlord.id ? "Chủ trọ" : "Sinh viên";

    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(
        CHAT_PROFILE_PREVIEW_KEY,
        JSON.stringify({
          id: currentConv.partner.id,
          email: currentConv.partner.email || "",
          full_name: currentConv.partner.full_name || currentConv.display_name || "",
          avatar_url: currentConv.partner.avatar_url || currentConv.display_avatar || "",
          phone_number: currentConv.partner.phone_number || "",
          role: partnerRole,
          isOnline: isCurrentPartnerOnline,
          savedAt: new Date().toISOString(),
        }),
      );
    }
    setShowProfile(false);
    router.push(`/profile?chatUserId=${currentConv.partner.id}`);
  }, [currentConv, isCurrentPartnerOnline, router]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-50 transition-colors dark:bg-[#0a0a0a]">
      <div className="flex-none z-50">
        <UserTopBar />
      </div>

      <div className="flex flex-1 overflow-hidden mt-px">
        {/* === SIDEBAR DANH SÁCH CHAT === */}
        <aside className="z-40 flex w-80 flex-col border-r border-gray-200 bg-white transition-colors dark:border-gray-800 dark:bg-gray-900">
          <div className="flex-none px-5 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-5">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Đoạn chat</h1>
                <button className="rounded-full bg-gray-100 p-2.5 text-gray-600 transition hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                    <Pencil2Icon className="h-5 w-5" />
                </button>
            </div>
            
            <div className="relative group">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 transition group-focus-within:text-[#d51f35] dark:text-gray-500" />
                <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm kiếm..." 
                    className="w-full rounded-2xl bg-gray-100 py-3 pl-11 pr-4 text-sm text-gray-900 outline-none transition focus:bg-white focus:ring-1 focus:ring-[#d51f35] dark:bg-gray-800 dark:text-white dark:focus:bg-gray-900 dark:placeholder-gray-500" 
                />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
            <div>
                {filteredConversations.map((c) => (
                <ConversationItem 
                    key={c.id} 
                    convo={c} 
                    active={c.id === selectedId} 
                    onSelect={() => setSelectedId(c.id)}
                    isOnline={onlineUsers.includes(c.partner.id)} 
                />
                ))}
            </div>
            {filteredConversations.length === 0 && (
                <div className="flex flex-col items-center justify-center h-40 text-center px-4 opacity-60">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {searchTerm ? "Không tìm thấy kết quả" : "Chưa có tin nhắn nào"}
                    </p>
                </div>
            )}
          </div>
        </aside>

        {/* === MAIN CHAT AREA === */}
        <section className="relative flex min-w-0 flex-1 flex-col bg-[#f8f9fa] dark:bg-[#0a0a0a]">
          {currentConv ? (
             <>
                {/* HEADER TRONG KHUNG CHAT */}
                <header className="z-30 flex flex-none items-center justify-between border-b border-gray-200 bg-white/90 px-6 py-3.5 backdrop-blur-md transition-colors dark:border-gray-800 dark:bg-gray-900/90">
                    <div className="flex items-center gap-3">
                        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gray-100 font-bold text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                            {currentConv.display_avatar ? (
                                <Image src={currentConv.display_avatar} alt="Avt" fill className="object-cover" unoptimized />
                            ) : (
                                currentConv.display_name?.charAt(0).toUpperCase()
                            )}
                            {isCurrentPartnerOnline && (
                                <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500 dark:border-gray-900"></span>
                            )}
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-900 dark:text-white">{currentConv.display_name}</h2>
                            <p className={`text-xs font-semibold mt-0.5 ${isCurrentPartnerOnline ? "text-green-600 dark:text-green-500" : "text-gray-500 dark:text-gray-400"}`}>
                                {isCurrentPartnerOnline ? "Đang hoạt động" : "Ngoại tuyến"}
                            </p>
                        </div>
                    </div>
                    <div>
                        <button 
                            onClick={() => setShowProfile(true)}
                            className="rounded-full p-2.5 text-gray-500 transition hover:bg-gray-100 hover:text-[#d51f35] dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-red-400"
                        >
                            <InfoCircledIcon className="h-6 w-6" />
                        </button>
                    </div>
                </header>

                {/* KHU VỰC HIỂN THỊ TIN NHẮN */}
                <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
                    <div className="flex justify-center mb-8">
                        <div className="rounded-full bg-gray-200 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                            Bắt đầu cuộc trò chuyện
                        </div>
                    </div>
                    {messages.map((m, idx) => (
                        <MessageBubble key={idx} msg={m} isMe={m.sender.id === currentUserId} />
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Ô NHẬP TIN NHẮN */}
                <div className="flex-none border-t border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
                    <form onSubmit={handleSend} className="max-w-5xl mx-auto space-y-3">
                        <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                        
                        {pendingImageUrl ? (
                          <div className="inline-flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
                            <Image src={pendingImageUrl} alt="Ảnh sắp gửi" width={56} height={56} unoptimized className="h-14 w-14 rounded-xl object-cover" />
                            <button type="button" onClick={() => setPendingImageUrl(null)} className="rounded-full p-1.5 text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700">
                              <Cross2Icon className="h-5 w-5" />
                            </button>
                          </div>
                        ) : null}
                        
                        {uploadError ? <p className="text-xs font-semibold text-red-500 pl-2">{uploadError}</p> : null}
                        
                        <div className="flex items-end gap-3">
                          <button
                            type="button" onClick={() => imageInputRef.current?.click()}
                            disabled={isUploadingImage}
                            className="mb-1 rounded-full bg-gray-100 p-3 text-gray-600 transition hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                          >
                            <ImageIcon className="h-6 w-6" />
                          </button>
                          
                          <div className="relative flex-1 rounded-full border border-gray-300 bg-gray-50 transition-all focus-within:border-[#d51f35] focus-within:bg-white dark:border-gray-700 dark:bg-gray-800 dark:focus-within:border-red-500 dark:focus-within:bg-gray-900">
                              <input
                                  type="text" value={inputVal} onChange={(e) => setInputVal(e.target.value)}
                                  placeholder={isUploadingImage ? "Đang tải hình ảnh..." : "Nhập tin nhắn..."}
                                  className="w-full rounded-full bg-transparent px-5 py-3.5 pr-14 text-[15px] text-gray-900 outline-none dark:text-white dark:placeholder-gray-500"
                              />
                              <button
                                  type="submit" disabled={(!inputVal.trim() && !pendingImageUrl) || isUploadingImage}
                                  className="absolute bottom-[5px] right-[5px] flex items-center justify-center rounded-full bg-[#d51f35] p-2.5 text-white shadow-sm transition-all hover:bg-[#b01628] active:scale-95 disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none dark:disabled:bg-gray-800 dark:disabled:text-gray-600"
                              >
                                  <PaperPlaneIcon className="h-5 w-5 -ml-0.5 mt-0.5 transform -rotate-45" />
                              </button>
                          </div>
                        </div>
                    </form>
                </div>
                
                {showProfile && (
                    <UserProfileModal 
                        user={currentConv.partner} 
                        onClose={() => setShowProfile(false)} 
                        isOnline={isCurrentPartnerOnline}
                        role={currentConv.partner.id === currentConv.landlord.id ? "Chủ trọ" : "Sinh viên"}
                        onViewProfile={handleViewPartnerProfile}
                    />
                )}
             </>
          ) : (
             <div className="flex h-full flex-col items-center justify-center bg-gray-50 dark:bg-[#0a0a0a]">
                 <div className="mb-6 flex h-28 w-28 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                    <span className="text-5xl opacity-80">💬</span>
                 </div>
                 <p className="text-xl font-bold text-gray-900 dark:text-white">Chào mừng đến với VLU Chat</p>
                 <p className="mt-2 max-w-sm text-center text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                    Khám phá, kết nối và trao đổi thông tin thuê trọ dễ dàng. Chọn một cuộc hội thoại bên trái để bắt đầu.
                 </p>
             </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-gray-500 dark:text-gray-400 dark:bg-[#0a0a0a]"><span className="animate-spin text-3xl mr-3">⏳</span> Đang kết nối trò chuyện...</div>}>
      <ChatPageContent />
    </Suspense>
  );
}