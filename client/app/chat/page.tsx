"use client";

import Image from "next/image";
import { Suspense } from "react";
import { useEffect, useState, useRef, FormEvent, useMemo, useCallback, ChangeEvent } from "react";
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
let socket: Socket | null = null;
const CHAT_PROFILE_PREVIEW_KEY = "vlu.chat.profile.preview";

// --- UTILS FORMAT THỜI GIAN CHUẨN ---
// Hàm này giải quyết triệt để lỗi mất chữ Z (Múi giờ UTC) từ Database trả về
const parseSafeDate = (dateString?: string) => {
  if (!dateString) return null;
  // Xử lý chuỗi để ép trình duyệt hiểu đúng múi giờ UTC
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
  
  // Xóa bỏ Giờ/Phút/Giây, chỉ giữ lại đúng Ngày/Tháng/Năm để so sánh
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  // Tính chính xác khoảng cách bao nhiêu ngày
  const dayDiff = Math.floor((today.getTime() - targetDay.getTime()) / (1000 * 60 * 60 * 24));

  if (dayDiff === 0) {
    // Nếu gửi trong cùng ngày hôm nay -> Chỉ hiện giờ (VD: 00:23)
    return formatTime(dateString);
  } else if (dayDiff === 1) {
    // Ngày hôm qua
    return "Hôm qua";
  } else if (dayDiff > 1 && dayDiff <= 7) {
    // Trong vòng 1 tuần
    return `${dayDiff} ngày trước`;
  } else {
    // Quá lâu thì hiện Ngày/Tháng
    return date.toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit' });
  }
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
  if (imageUrl && text) return `Hinh anh: ${text}`;
  if (imageUrl) return "Hinh anh";
  const normalized = (text || "").trim();
  return normalized || "Chua co tin nhan";
};

const getComparableTimestamp = (dateString?: string) => {
  const parsed = parseSafeDate(dateString);
  return parsed ? parsed.getTime() : 0;
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
  created_at: string; // Thêm trường này
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

function UserProfileModal({ 
  user, 
  onClose, 
  isOnline,
  onViewProfile,
  role // Thêm trường role
}: { 
  user: User; 
  onClose: () => void; 
  isOnline: boolean;
  onViewProfile: () => void;
  role: string;
}) {
  const normalizedRole = role.trim().toLowerCase();
  const roleBadgeClassName = normalizedRole.includes("admin")
    ? "bg-blue-100 text-blue-700"
    : normalizedRole.includes("sinh")
      ? "bg-red-100 text-red-700"
      : "bg-yellow-100 text-yellow-700";

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative z-101 w-full max-w-sm rounded-3xl border border-(--theme-border) bg-(--theme-surface) p-6 text-(--theme-text) shadow-2xl">
        <div className="flex justify-end">
          <button onClick={onClose} className="rounded-full p-1 text-(--theme-text-subtle) transition hover:bg-(--theme-surface-muted)">
            <Cross2Icon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="flex flex-col items-center gap-3">
          <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-(--theme-surface) bg-(--theme-surface-muted) shadow-lg">
            {user.avatar_url ? (
              <Image src={user.avatar_url} alt="Avatar" fill className="object-cover" unoptimized />
            ) : (
              <span className="text-4xl font-bold text-(--theme-text-subtle)">{user.full_name?.charAt(0).toUpperCase() || "U"}</span>
            )}
            {isOnline && (
              <span className="absolute bottom-1 right-1 h-5 w-5 rounded-full border-4 border-(--theme-surface) bg-green-500"></span>
            )}
          </div>
          
          <div className="text-center">
            <h2 className="text-xl font-bold text-(--theme-text)">{user.full_name || "Người dùng ẩn danh"}</h2>
            
            {/* HIỂN THỊ VAI TRÒ (CHỦ TRỌ / SINH VIÊN) */}
            <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-semibold ${roleBadgeClassName}`}>
              {role}
            </span>

            <p className={`text-sm font-medium mt-2 ${isOnline ? "text-green-600" : "text-(--theme-text-muted)"}`}>
              {isOnline ? "Đang hoạt động" : "Ngoại tuyến"}
            </p>
          </div>
          
          <div className="w-full space-y-3 mt-4">
            <div className="flex items-center gap-3 rounded-xl border border-(--theme-border) bg-(--theme-surface-muted) p-3">
              <EnvelopeClosedIcon className="h-5 w-5 text-(--theme-text-subtle)" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium uppercase text-(--theme-text-subtle)">Email</p>
                <p className="text-sm truncate text-(--theme-text-muted)">{user.email || "Đang cập nhật..."}</p>
              </div>
            </div>
            {user.phone_number && (
                <div className="flex items-center gap-3 rounded-xl border border-(--theme-border) bg-(--theme-surface-muted) p-3">
                <PersonIcon className="h-5 w-5 text-(--theme-text-subtle)" />
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium uppercase text-(--theme-text-subtle)">Số điện thoại</p>
                    <p className="text-sm font-semibold truncate text-(--theme-text)">{user.phone_number}</p>
                </div>
                </div>
            )}
          </div>

          <button
            type="button"
            onClick={onViewProfile}
            className="mt-6 w-full rounded-full border border-(--theme-border) bg-(--theme-surface) py-2.5 text-sm font-semibold text-(--theme-text) shadow-sm transition hover:bg-(--theme-surface-muted) active:scale-95"
          >
            Xem trang cá nhân
          </button>

          <button 
            type="button"
            onClick={onClose}
            className="mt-3 w-full rounded-full bg-(--brand-accent) py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-(--brand-accent-strong) active:scale-95"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

function ConversationItem({ convo, active, onSelect, isOnline }: { convo: Conversation; active: boolean; onSelect: () => void; isOnline: boolean }) {
  const containerClass = active 
    ? "border border-[color:var(--theme-border-strong)] bg-[color:var(--brand-primary-soft)] shadow-sm ring-1 ring-[color:var(--brand-primary-soft)]" 
    : "border border-transparent hover:border-[color:var(--theme-border)] hover:bg-[color:var(--theme-surface-muted)]";

  return (
    <button
      onClick={onSelect}
      className={`group flex w-full items-center gap-3 rounded-xl p-3 mb-1 transition-all duration-200 ${containerClass}`}
    >
      <div className="relative h-12 w-12 shrink-0">
        <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border border-(--theme-border) bg-(--theme-surface-muted) text-lg font-bold text-(--theme-text-subtle)">
            {convo.display_avatar ? (
                <Image src={convo.display_avatar} alt="Avatar" fill className="object-cover" unoptimized />
            ) : (
                <span>{convo.display_name?.charAt(0).toUpperCase()}</span>
            )}
        </div>
        {isOnline && (
            <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-(--theme-surface) bg-green-500"></span>
        )}
      </div>
      
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between mb-0.5">
          <p className={`text-sm truncate ${active ? "font-bold text-(--theme-text)" : "font-semibold text-(--theme-text-muted)"}`}>
            {convo.display_name}
          </p>
          <span className={`text-[10px] whitespace-nowrap ${active ? "font-medium text-(--brand-primary-text)" : "text-(--theme-text-subtle)"}`}>
            {formatRelativeTime(convo.last_time)}
          </span>
        </div>
        <p className={`text-xs truncate ${active ? "font-medium text-(--theme-text-muted)" : "text-(--theme-text-subtle)"}`}>
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
         <div className="mb-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-(--theme-surface-muted) text-[10px] font-bold text-(--theme-text-muted) shadow-sm">
             Bot
         </div>
      )}
      
      <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[75%]`}>
        <div
            className={`px-4 py-2.5 text-[15px] shadow-sm leading-relaxed whitespace-pre-wrap wrap-break-word ${
            isMe 
                ? "bg-(--brand-accent) text-white rounded-2xl rounded-tr-sm" 
                : "rounded-2xl rounded-tl-sm border border-(--theme-border) bg-(--theme-surface) text-(--theme-text)"
            }`}
        >
            {imageUrl ? (
              <a href={imageUrl} target="_blank" rel="noreferrer" className="mb-2 block overflow-hidden rounded-xl border border-white/20">
                <Image src={imageUrl} alt="Anh dinh kem" width={320} height={320} unoptimized className="h-auto w-full object-cover" />
              </a>
            ) : null}
            {text ? <span>{text}</span> : null}
        </div>
        <span className={`text-[10px] mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 select-none ${isMe ? "text-right text-(--theme-text-subtle)" : "text-(--theme-text-subtle)"}`}>
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
  const selectedIdRef = useRef<number | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const partnerIdFromUrl = searchParams.get('partnerId');

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  const mapConversation = useCallback((c: RawConversation): Conversation => {
    // 1. Xác định ai là người chat cùng mình
    const rawPartner = c.student.id === currentUserId ? c.landlord : c.student;
    
    // 2. Lấy thông tin từ bảng profile một cách "danh chính ngôn thuận" không cần any
    const partnerProfile = rawPartner.profile || {};
    
    // 3. Gộp dữ liệu lại cho gọn
    const otherUser = {
      ...rawPartner,
      full_name: rawPartner.full_name || partnerProfile.full_name || rawPartner.email,
      avatar_url: rawPartner.avatar_url || partnerProfile.avatar_url || "",
      phone_number: rawPartner.phone_number || partnerProfile.phone_number || "",
    };
    
    let lastMsg = "";
    let lastTime = c.created_at || ""; 
    
    if (c.messages && c.messages.length > 0) {
        const latest = c.messages.reduce((currentLatest, item) => {
          if (!currentLatest) return item;

          const latestTs = getComparableTimestamp(currentLatest.created_at);
          const itemTs = getComparableTimestamp(item.created_at);

          if (itemTs > latestTs) return item;
          if (itemTs < latestTs) return currentLatest;

          return item.id > currentLatest.id ? item : currentLatest;
        }, c.messages[0]);

        lastMsg = latest.content;
        lastTime = latest.created_at;
    }

    return {
        id: c.id, 
        student: c.student, 
        landlord: c.landlord,
        // 👇 Bây giờ display_name và display_avatar sẽ lấy chuẩn 100%
        display_name: otherUser.full_name || "Người dùng",
        display_avatar: otherUser.avatar_url || "", 
        last_message: lastMsg, 
        last_time: lastTime, 
        partner: otherUser
    };
  }, [currentUserId]);

  // 1. Initial Load & Socket Setup
  useEffect(() => {
    if (!currentUserId || !accessToken) return;

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

    // --- SETUP SOCKET ---
    const socketInstance = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    socket = socketInstance;
    
    socketInstance.emit("user_connected", currentUserId);

    socketInstance.on("user_online", (userId: number) => {
      setOnlineUsers(prev => {
        if (!prev.includes(userId)) return [...prev, userId];
        return prev;
      });
    });

    socketInstance.on("user_offline", (userId: number) => {
      setOnlineUsers(prev => prev.filter(id => id !== userId));
    });

    socketInstance.on("online_status_result", (data: { userId: number, isOnline: boolean }) => {
      if (data.isOnline) {
        setOnlineUsers(prev => prev.includes(data.userId) ? prev : [...prev, data.userId]);
      } else {
        setOnlineUsers(prev => prev.filter(id => id !== data.userId));
      }
    });

    const handleNewMessage = (newMsg: Message) => {
        // Gán thời gian chuẩn (UTC) nếu socket không có để tránh lỗi sai múi giờ
        if (!newMsg.created_at) newMsg.created_at = new Date().toISOString();

        if (selectedIdRef.current === newMsg.conversation.id) {
          setMessages((prev) => {
            if (prev.some((msg) => msg.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          setTimeout(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, 100);
        }
        
        setConversations(prev => {
            const index = prev.findIndex(c => c.id === newMsg.conversation.id);
            if (index === -1) return prev; // Chặn lỗi không tìm thấy
            
            const newArr = [...prev];
            const updatedConvo = { ...newArr[index], last_message: newMsg.content, last_time: newMsg.created_at };
            newArr.splice(index, 1);
            newArr.unshift(updatedConvo);
            return newArr;
        });
    };

    socketInstance.on("new_message", handleNewMessage);

    return () => {
      socketInstance.off("new_message", handleNewMessage);
      socketInstance.disconnect();
      if (socket === socketInstance) socket = null;
    };
    }, [currentUserId, accessToken, partnerIdFromUrl, mapConversation, router]);

  // Fetch Messages & Check Online Status khi đổi cuộc hội thoại
  useEffect(() => {
      if (!selectedId || !accessToken) return;
      
      socket?.emit("join_conversation", selectedId);

      fetch(`${SOCKET_URL}/chat/${selectedId}/messages`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      .then(res => res.json())
      .then(setMessages)
      .catch(console.error);
  }, [selectedId, accessToken]);

  useEffect(() => {
    if (!selectedId || !socket) return;
    const currentConv = conversations.find(c => c.id === selectedId);
    if (currentConv) {
      socket.emit("check_online_status", currentConv.partner.id);
    }
  }, [selectedId, conversations]);

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
      setUploadError("Chi ho tro tep hinh anh.");
      event.target.value = "";
      return;
    }

    setIsUploadingImage(true);
    try {
      const uploaded = await uploadImages([file]);
      const firstUrl = uploaded[0];
      if (!firstUrl) setUploadError("Tai anh that bai. Vui long thu lai.");
      else setPendingImageUrl(firstUrl);
    } catch {
      setUploadError("Tai anh that bai. Vui long thu lai.");
    } finally {
      setIsUploadingImage(false);
      event.target.value = "";
    }
  };

  const handleSend = (e: FormEvent) => {
      e.preventDefault();
      if ((!inputVal.trim() && !pendingImageUrl) || !selectedId || !currentUserId || isUploadingImage) return;

      const payload = {
          conversationId: selectedId,
          senderId: currentUserId,
          content: buildMessageContent(inputVal, pendingImageUrl)
      };
      if (!socket) return;
      socket.emit("send_message", payload);
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
    <div className="flex h-screen flex-col overflow-hidden bg-(--theme-bg) text-(--theme-text)">
      <div className="flex-none z-50">
        <UserTopBar />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* === SIDEBAR === */}
        <aside className="z-40 flex w-80 flex-col border-r border-(--theme-border) bg-(--theme-surface)">
          <div className="flex-none px-5 pt-6 pb-2">
            <div className="flex items-center justify-between mb-5">
                <h1 className="text-2xl font-bold tracking-tight text-(--theme-text)">Đoạn chat</h1>
                <button className="rounded-full border border-(--theme-border) bg-(--theme-surface-muted) p-2 text-(--theme-text-muted) transition hover:bg-(--brand-primary-soft) hover:text-(--brand-primary-text)">
                    <Pencil2Icon className="h-5 w-5" />
                </button>
            </div>
            
            <div className="relative group">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--theme-text-subtle) transition group-focus-within:text-(--brand-primary-text)" />
                <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm kiếm cuộc trò chuyện..." 
                    className="w-full rounded-2xl border border-transparent bg-(--theme-surface-muted) py-3 pl-10 pr-4 text-sm text-(--theme-text) outline-none transition duration-200 placeholder:text-(--theme-text-subtle) focus:border-(--theme-border-strong) focus:bg-(--theme-surface) focus:ring-2 focus:ring-(--brand-primary-soft)" 
                />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-2 scrollbar-thin scrollbar-thumb-gray-200">
            <div className="space-y-1">
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
                    <p className="text-sm font-medium text-(--theme-text-muted)">
                        {searchTerm ? "Không tìm thấy kết quả" : "Chưa có tin nhắn nào"}
                    </p>
                </div>
            )}
          </div>
        </aside>

        {/* === MAIN CHAT === */}
        <section className="relative flex min-w-0 flex-1 flex-col bg-(--theme-bg)">
          {currentConv ? (
             <>
                <header className="z-30 flex flex-none items-center justify-between border-b border-(--theme-border) bg-(--theme-surface)/90 px-6 py-3 backdrop-blur">
                    <div className="flex items-center gap-3.5">
                        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-(--theme-border) bg-(--theme-surface-muted) text-lg font-bold text-(--theme-text-subtle) shadow-sm">
                            {currentConv.display_avatar ? (
                                <Image src={currentConv.display_avatar} alt="Avt" fill className="object-cover" unoptimized />
                            ) : (
                                currentConv.display_name?.charAt(0).toUpperCase()
                            )}
                            {isCurrentPartnerOnline && (
                                <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-(--theme-surface) bg-green-500"></span>
                            )}
                        </div>
                        <div>
                            <h2 className="text-[17px] font-bold leading-tight text-(--theme-text)">{currentConv.display_name}</h2>
                            <p className={`text-xs font-medium mt-0.5 transition-colors ${isCurrentPartnerOnline ? "text-green-600" : "text-(--theme-text-subtle)"}`}>
                                {isCurrentPartnerOnline ? "Đang hoạt động" : "Ngoại tuyến"}
                            </p>
                        </div>
                    </div>
                    <div>
                        <button 
                            onClick={() => setShowProfile(true)}
                            className="rounded-full p-2.5 text-(--theme-text-subtle) transition duration-200 hover:bg-(--theme-surface-muted) hover:text-(--brand-primary-text)"
                        >
                            <InfoCircledIcon className="h-6 w-6" />
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto bg-(--theme-bg) px-6 py-6">
                    <div className="flex justify-center mb-8">
                        <div className="rounded-full border border-(--theme-border) bg-(--theme-surface) px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-(--theme-text-subtle) shadow-sm backdrop-blur">
                            Bắt đầu cuộc trò chuyện
                        </div>
                    </div>
                    {messages.map((m, idx) => (
                        <MessageBubble key={m.id ?? `${m.created_at}-${idx}`} msg={m} isMe={m.sender.id === currentUserId} />
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                <div className="flex-none border-t border-(--theme-border) bg-(--theme-surface) px-6 py-5">
                    <form onSubmit={handleSend} className="max-w-5xl mx-auto space-y-3">
                        <input
                            ref={imageInputRef} type="file" accept="image/*"
                            onChange={handleImageChange} className="hidden"
                        />
                        {pendingImageUrl ? (
                          <div className="inline-flex items-center gap-3 rounded-2xl border border-(--theme-border) bg-(--theme-surface-muted) px-3 py-2">
                            <Image
                              src={pendingImageUrl} alt="Anh sap gui" width={56} height={56} unoptimized
                              className="h-14 w-14 rounded-xl object-cover"
                            />
                            <button
                              type="button" onClick={() => setPendingImageUrl(null)}
                              className="rounded-full p-1 text-(--theme-text-subtle) transition hover:bg-(--theme-surface)"
                            >
                              <Cross2Icon className="h-4 w-4" />
                            </button>
                          </div>
                        ) : null}
                        {uploadError ? <p className="text-xs font-medium text-red-500">{uploadError}</p> : null}
                        <div className="flex items-end gap-3">
                          <button
                            type="button" onClick={() => imageInputRef.current?.click()}
                            disabled={isUploadingImage}
                            className="mb-2 rounded-full p-2 text-(--theme-text-subtle) transition hover:bg-(--theme-surface-muted) disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <ImageIcon className="h-6 w-6" />
                          </button>
                          <div className="relative flex-1 rounded-3xl border border-(--theme-border) bg-(--theme-surface-muted) shadow-sm transition-all duration-200 focus-within:border-(--theme-border-strong) focus-within:bg-(--theme-surface) focus-within:ring-2 focus-within:ring-(--brand-accent-soft)">
                              <input
                                  type="text" value={inputVal} onChange={(e) => setInputVal(e.target.value)}
                                  placeholder={isUploadingImage ? "Đang tải hình ảnh..." : "Nhập tin nhắn..."}
                                  className="w-full rounded-3xl bg-transparent px-5 py-3.5 pr-12 text-[15px] text-(--theme-text) placeholder:text-(--theme-text-subtle) outline-none"
                              />
                              <button
                                  type="submit" disabled={(!inputVal.trim() && !pendingImageUrl) || isUploadingImage}
                                  className="absolute bottom-1.5 right-2 flex items-center justify-center rounded-full bg-(--brand-accent) p-2 text-white shadow-md transition-all hover:scale-105 hover:bg-(--brand-accent-strong) active:scale-95 disabled:bg-(--theme-surface-muted) disabled:text-(--theme-text-subtle) disabled:shadow-none"
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
             <div className="flex h-full flex-col items-center justify-center bg-(--theme-bg) text-(--theme-text-subtle)">
                 <div className="mb-6 flex h-28 w-28 items-center justify-center rounded-full border border-(--theme-border) bg-(--brand-primary-soft) animate-pulse">
                    <span className="text-5xl">💬</span>
                 </div>
                 <p className="text-2xl font-bold text-(--theme-text)">Chào mừng đến với VLU Renting Chat</p>
                 <p className="mt-2 max-w-md text-center text-base leading-relaxed text-(--theme-text-muted)">
                    Khám phá, kết nối và trao đổi thông tin thuê trọ dễ dàng. Chọn một cuộc hội thoại để bắt đầu.
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
    <Suspense fallback={<div className="p-6 text-sm text-(--theme-text-subtle)">Đang tải trò chuyện...</div>}>
      <ChatPageContent />
    </Suspense>
  );
}
