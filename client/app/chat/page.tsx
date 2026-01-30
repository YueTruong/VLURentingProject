"use client";

import Image from "next/image";
import { useEffect, useState, useRef, FormEvent, useMemo, useCallback } from "react";
import io, { Socket } from "socket.io-client";
import { useSession } from "next-auth/react";
import UserTopBar from "@/app/homepage/components/UserTopBar";
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
let socket: Socket;

// --- UTILS FORMAT THỜI GIAN (Đã sửa lỗi lệch 7 tiếng) ---
const formatTime = (dateString: string) => {
  if (!dateString) return "";
  
  // Tạo đối tượng Date từ chuỗi (Server trả về UTC)
  const date = new Date(dateString);

  // Kiểm tra nếu date không hợp lệ
  if (isNaN(date.getTime())) return "";

  // toLocaleTimeString sẽ tự động convert sang múi giờ của máy tính người dùng (VN)
  return date.toLocaleTimeString("vi-VN", { 
    hour: "2-digit", 
    minute: "2-digit", 
    hour12: false 
  });
};

const formatRelativeTime = (dateString?: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  
  // Tính khoảng cách thời gian
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  // Xử lý các mốc thời gian
  if (seconds < 60) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút`;
  if (hours < 24) {
    // Nếu trong cùng một ngày -> hiện giờ
    if (date.getDate() === now.getDate()) {
        return formatTime(dateString);
    }
    return "Hôm qua"; // Nếu khác ngày nhưng chưa qua 24h (hiếm gặp nhưng logic đúng)
  }
  if (days === 1) return "Hôm qua";
  if (days < 7) return `${days} ngày`; // Rút gọn cho Sidebar
  
  // Quá 7 ngày thì hiện ngày/tháng/năm
  return date.toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit' });
};

// --- TYPES ---
type User = {
  id: number;
  email: string;
  full_name?: string;
  avatar_url?: string;
  phone_number?: string;
};

interface RawConversation {
  id: number;
  student: User;
  landlord: User;
  messages: Message[];
  updated_at: string;
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

function UserProfileModal({ user, onClose }: { user: User; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl relative z-101">
        <div className="flex justify-end">
          <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100 text-gray-500 transition">
            <Cross2Icon className="h-6 w-6" />
          </button>
        </div>
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-white shadow-lg bg-gray-100 flex items-center justify-center">
            {user.avatar_url ? (
              <Image src={user.avatar_url} alt="Avatar" fill className="object-cover" unoptimized />
            ) : (
              <span className="text-4xl font-bold text-gray-400">{user.full_name?.charAt(0).toUpperCase() || "U"}</span>
            )}
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900">{user.full_name || "Người dùng"}</h2>
            <p className="text-sm text-gray-500">Thành viên VLU Renting</p>
          </div>
          
          <div className="w-full space-y-3 mt-2">
            <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3 border border-gray-100">
              <EnvelopeClosedIcon className="h-5 w-5 text-gray-400" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 font-medium uppercase">Email</p>
                <p className="text-sm text-gray-700 truncate">{user.email}</p>
              </div>
            </div>
            {user.phone_number && (
                <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3 border border-gray-100">
                <PersonIcon className="h-5 w-5 text-gray-400" />
                <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 font-medium uppercase">Số điện thoại</p>
                    <p className="text-sm text-gray-700 truncate">{user.phone_number}</p>
                </div>
                </div>
            )}
          </div>

          <button 
            onClick={onClose}
            className="mt-4 w-full rounded-full bg-[#0b1a57] py-2.5 text-sm font-semibold text-white hover:bg-[#0a1647] transition shadow-md active:scale-95"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

function ConversationItem({ convo, active, onSelect }: { convo: Conversation; active: boolean; onSelect: () => void }) {
  // Tính toán style dựa trên trạng thái active
  const containerClass = active 
    ? "bg-blue-50/80 shadow-sm border border-blue-100 ring-1 ring-blue-100" 
    : "hover:bg-gray-50 border border-transparent hover:border-gray-100";

  return (
    <button
      onClick={onSelect}
      className={`group flex w-full items-center gap-3 rounded-xl p-3 mb-1 transition-all duration-200 ${containerClass}`}
    >
      <div className="relative h-12 w-12 shrink-0">
        <div className="h-full w-full overflow-hidden rounded-full border border-gray-200 bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-lg">
            {convo.display_avatar ? (
                <Image src={convo.display_avatar} alt="Avatar" fill className="object-cover" unoptimized />
            ) : (
                <span>{convo.display_name?.charAt(0).toUpperCase()}</span>
            )}
        </div>
      </div>
      
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between mb-0.5">
          <p className={`text-sm truncate ${active ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
            {convo.display_name}
          </p>
          <span className={`text-[10px] whitespace-nowrap ${active ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
            {formatRelativeTime(convo.last_time)}
          </span>
        </div>
        <p className={`text-xs truncate ${active ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
          {convo.last_message || "Chưa có tin nhắn"}
        </p>
      </div>
    </button>
  );
}

function MessageBubble({ msg, isMe }: { msg: Message; isMe: boolean }) {
  const timeStr = formatTime(msg.created_at);

  return (
    <div className={`flex items-end gap-2 mb-4 group ${isMe ? "justify-end" : "justify-start"}`}>
      {!isMe && (
         <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600 shrink-0 mb-1 shadow-sm">
             Bot
         </div>
      )}
      
      <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[75%]`}>
        <div
            className={`px-4 py-2.5 text-[15px] shadow-sm leading-relaxed whitespace-pre-wrap wrap-break-word ${
            isMe 
                ? "bg-[#D51F35] text-white rounded-2xl rounded-tr-sm" 
                : "bg-white text-gray-900 border border-gray-100 rounded-2xl rounded-tl-sm"
            }`}
        >
            {msg.content}
        </div>
        <span className={`text-[10px] mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 select-none ${isMe ? "text-gray-400 text-right" : "text-gray-400"}`}>
            {timeStr}
        </span>
      </div>
    </div>
  );
}

// --- MAIN PAGE ---

export default function ChatPage() {
  const { data: session } = useSession();
  const currentUserId = session?.user ? Number(session.user.id) : null;
  const accessToken = session?.user?.accessToken;

  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputVal, setInputVal] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showProfile, setShowProfile] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const partnerIdFromUrl = searchParams.get('partnerId');

  // 🛠️ FIX ESLINT: Dùng useCallback cho hàm map
  const mapConversation = useCallback((c: RawConversation): Conversation => {
    const otherUser = c.student.id === currentUserId ? c.landlord : c.student;
    
    let lastMsg = "";
    // Sử dụng updated_at làm thời gian cơ sở nếu chưa có tin nhắn
    let lastTime = c.updated_at || new Date().toISOString(); 
    
    if (c.messages && c.messages.length > 0) {
        const last = c.messages[c.messages.length - 1];
        lastMsg = last.content;
        lastTime = last.created_at;
    }

    return {
        id: c.id,
        student: c.student,
        landlord: c.landlord,
        display_name: otherUser?.full_name || otherUser?.email || "Người dùng",
        display_avatar: otherUser?.avatar_url || "", 
        last_message: lastMsg,
        last_time: lastTime,
        partner: otherUser
    };
  }, [currentUserId]); // Hàm này chỉ tạo lại khi user đổi

  // 1. Initial Load & Socket Setup
  useEffect(() => {
    if (!currentUserId || !accessToken) return;

    // A. Lấy danh sách chat
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
    })
    .catch(console.error);

    // B. Socket
    socket = io(SOCKET_URL);
    
    socket.on("new_message", (newMsg: Message) => {
        // Fix thời gian thực cho tin nhắn vừa nhận
        // Backend có thể gửi created_at là Date object hoặc string, ta chuẩn hóa về ISO string
        if (!newMsg.created_at) newMsg.created_at = new Date().toISOString();

        // 1. Cập nhật Sidebar
        setConversations(prev => {
            // Tìm cuộc trò chuyện
            const index = prev.findIndex(c => c.id === newMsg.conversation.id);
            
            // Clone mảng cũ
            const newArr = [...prev];
            
            let updatedConvo;
            
            if (index !== -1) {
                // Nếu đã có -> Cập nhật và đưa lên đầu
                updatedConvo = { 
                    ...newArr[index], 
                    last_message: newMsg.content,
                    last_time: newMsg.created_at
                };
                newArr.splice(index, 1);
            } else {
                // Trường hợp hiếm: Chat mới chưa có trong list (reload lại sẽ có, nhưng update luôn cho mượt)
                return prev; 
            }

            newArr.unshift(updatedConvo);
            return newArr;
        });
    });

    return () => { socket.disconnect(); };
  }, [currentUserId, accessToken, partnerIdFromUrl, mapConversation, router]); // 🛠️ Đã thêm đủ dependency

  // Logic nhận tin nhắn riêng (để update UI chat bubble)
  useEffect(() => {
    const handleNewMsg = (newMsg: Message) => {
        // Chỉ thêm vào list messages nếu đang mở đúng hội thoại đó
        if (selectedId === newMsg.conversation.id) {
            setMessages(prev => [...prev, newMsg]);
            // Scroll xuống
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
        }
    };

    if (socket) {
        socket.off("new_message_ui"); // Clean up custom listener nếu có
        // Chúng ta reuse event "new_message" nhưng handle logic khác nhau ở 2 useEffect
        socket.on("new_message", handleNewMsg);
    }
    
    // Cleanup listener này khi unmount hoặc đổi selectedId
    return () => {
        if (socket) socket.off("new_message", handleNewMsg);
    }
  }, [selectedId]);


  // 2. Fetch Messages
  useEffect(() => {
      if (!selectedId || !accessToken) return;
      if (socket) socket.emit("join_conversation", selectedId);

      fetch(`${SOCKET_URL}/chat/${selectedId}/messages`, {
          headers: { Authorization: `Bearer ${accessToken}` }
      })
      .then(res => res.json())
      .then(setMessages)
      .catch(console.error);
  }, [selectedId, accessToken]);

  // 3. Scroll initial
  useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages]);

  // 4. Send
  const handleSend = (e: FormEvent) => {
      e.preventDefault();
      if (!inputVal.trim() || !selectedId || !currentUserId) return;

      const payload = {
          conversationId: selectedId,
          senderId: currentUserId,
          content: inputVal
      };
      socket.emit("send_message", payload);
      setInputVal("");
  };

  const filteredConversations = useMemo(() => {
      if (!searchTerm) return conversations;
      return conversations.filter(c => 
          c.display_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [conversations, searchTerm]);

  const currentConv = conversations.find(c => c.id === selectedId);

  return (
    <div className="flex h-screen flex-col bg-white overflow-hidden">
      
      <div className="flex-none z-50">
        <UserTopBar />
      </div>

      <div className="flex flex-1 overflow-hidden">
        
        {/* === SIDEBAR === */}
        <aside className="w-80 flex flex-col border-r border-gray-100 bg-white z-40">
          
          <div className="flex-none px-5 pt-6 pb-2">
            <div className="flex items-center justify-between mb-5">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Đoạn chat</h1>
                <button className="rounded-full p-2 bg-gray-50 hover:bg-gray-100 text-gray-600 transition">
                    <Pencil2Icon className="h-5 w-5" />
                </button>
            </div>
            
            <div className="relative group">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition" />
                <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm kiếm cuộc trò chuyện..." 
                    className="w-full rounded-2xl bg-gray-100 py-3 pl-10 pr-4 text-sm text-gray-700 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition duration-200 border border-transparent focus:border-blue-200" 
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
                />
                ))}
            </div>
            {filteredConversations.length === 0 && (
                <div className="flex flex-col items-center justify-center h-40 text-center px-4 opacity-60">
                    <p className="text-sm font-medium text-gray-500">
                        {searchTerm ? "Không tìm thấy kết quả" : "Chưa có tin nhắn nào"}
                    </p>
                </div>
            )}
          </div>
        </aside>

        {/* === MAIN CHAT === */}
        <section className="flex-1 flex flex-col bg-white relative min-w-0">
          {currentConv ? (
             <>
                {/* Header Chat */}
                <header className="flex-none flex items-center justify-between border-b border-gray-100 px-6 py-3 bg-white/80 backdrop-blur z-30">
                    <div className="flex items-center gap-3.5">
                        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center font-bold text-gray-500 text-lg shadow-sm">
                            {currentConv.display_avatar ? (
                                <Image src={currentConv.display_avatar} alt="Avt" fill className="object-cover" unoptimized />
                            ) : (
                                currentConv.display_name?.charAt(0).toUpperCase()
                            )}
                            <span className="absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></span>
                        </div>
                        <div>
                            <h2 className="text-[17px] font-bold text-gray-900 leading-tight">{currentConv.display_name}</h2>
                            <p className="text-xs text-green-600 font-medium mt-0.5">Đang hoạt động</p>
                        </div>
                    </div>
                    <div>
                        <button 
                            onClick={() => setShowProfile(true)}
                            className="p-2.5 rounded-full hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition duration-200"
                        >
                            <InfoCircledIcon className="h-6 w-6" />
                        </button>
                    </div>
                </header>

                {/* Nội dung Chat */}
                <div className="flex-1 overflow-y-auto px-6 py-6 bg-[#fafafa]">
                    <div className="flex justify-center mb-8">
                        <div className="bg-gray-200/50 text-gray-500 text-[11px] uppercase tracking-wider px-4 py-1.5 rounded-full font-semibold shadow-sm backdrop-blur">
                            Bắt đầu cuộc trò chuyện
                        </div>
                    </div>
                    
                    {messages.map((m, idx) => (
                        <MessageBubble key={idx} msg={m} isMe={m.sender.id === currentUserId} />
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Chat (Đẹp hơn) */}
                <div className="flex-none px-6 py-5 bg-white border-t border-gray-100">
                    <form onSubmit={handleSend} className="flex items-end gap-3 max-w-5xl mx-auto relative">
                        <button type="button" className="mb-2 p-2 rounded-full text-gray-400 hover:bg-gray-100 transition">
                            <ImageIcon className="h-6 w-6" />
                        </button>
                        
                        <div className="flex-1 relative shadow-sm rounded-3xl bg-gray-50 border border-gray-200 focus-within:ring-2 focus-within:ring-red-100 focus-within:border-red-300 focus-within:bg-white transition-all duration-200">
                            <input
                                type="text"
                                value={inputVal}
                                onChange={(e) => setInputVal(e.target.value)}
                                placeholder="Nhập tin nhắn..."
                                className="w-full bg-transparent px-5 py-3.5 pr-12 text-[15px] text-gray-800 placeholder-gray-400 outline-none rounded-3xl"
                            />
                            <button
                                type="submit"
                                disabled={!inputVal.trim()}
                                className="absolute right-2 bottom-1.5 p-2 rounded-full bg-[#D51F35] text-white shadow-md hover:bg-[#b01628] disabled:bg-gray-300 disabled:shadow-none transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center"
                            >
                                <PaperPlaneIcon className="h-5 w-5 -ml-0.5 mt-0.5 transform -rotate-45" />
                            </button>
                        </div>
                    </form>
                </div>
                
                {/* Modal hiển thị khi bấm icon i */}
                {showProfile && (
                    <UserProfileModal user={currentConv.partner} onClose={() => setShowProfile(false)} />
                )}
             </>
          ) : (
             <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-gray-50/30">
                 <div className="h-28 w-28 bg-blue-50/50 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <span className="text-5xl">💬</span>
                 </div>
                 <p className="text-2xl font-bold text-gray-800">Chào mừng đến với VLU Renting Chat</p>
                 <p className="text-base text-gray-500 mt-2 max-w-md text-center leading-relaxed">
                    Khám phá, kết nối và trao đổi thông tin thuê trọ dễ dàng. Chọn một cuộc hội thoại để bắt đầu.
                 </p>
             </div>
          )}
        </section>
      </div>
    </div>
  );
}