"use client";

import Image from "next/image";
import { useEffect, useState, useRef, FormEvent } from "react";
import io, { Socket } from "socket.io-client";
import { useSession } from "next-auth/react";
import UserTopBar from "@/app/homepage/components/UserTopBar"; // ✅ Import TopBar có sẵn

import {
  ImageIcon,
  InfoCircledIcon,
  MagnifyingGlassIcon,
  PaperPlaneIcon,
  Pencil2Icon,
} from "@radix-ui/react-icons";

// --- CẤU HÌNH SOCKET ---
const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
let socket: Socket;

// --- ĐỊNH NGHĨA TYPE ---
type User = {
  id: number;
  email: string;
  full_name?: string;
  avatar_url?: string;
};

// Dữ liệu thô từ API
interface RawConversation {
  id: number;
  student: User;
  landlord: User;
  messages: Message[];
}

// Dữ liệu hiển thị
type Conversation = {
  id: number;
  student: User;
  landlord: User;
  display_name?: string; 
  display_avatar?: string;
  last_message?: string;
};

type Message = {
  id: number;
  sender: { id: number };
  content: string;
  created_at: string;
};

// --- COMPONENTS CON ---

function ConversationItem({
  convo,
  active,
  onSelect,
}: {
  convo: Conversation;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2 transition ${
        active ? "bg-red-50" : "hover:bg-gray-100"
      }`}
    >
      <div className="relative h-12 w-12 overflow-hidden rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold border">
        {convo.display_avatar ? (
            <Image 
              src={convo.display_avatar} 
              alt="Avatar" 
              fill 
              className="object-cover" 
              unoptimized 
            />
        ) : (
            <span className="text-lg">{convo.display_name?.charAt(0).toUpperCase()}</span>
        )}
      </div>
      <div className="flex-1 text-left">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-gray-900 line-clamp-1">{convo.display_name || `Chat #${convo.id}`}</p>
          <span className="text-xs text-gray-400">Vừa xong</span>
        </div>
        <p className="text-xs text-gray-600 line-clamp-1">{convo.last_message || "Chưa có tin nhắn"}</p>
      </div>
    </button>
  );
}

function MessageBubble({ msg, isMe }: { msg: Message; isMe: boolean }) {
    const timeStr = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
      {!isMe && (
         <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold">
             bot
         </div>
      )}
      
      <div
        className={`max-w-[65%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
          isMe ? "bg-red-500 text-white rounded-br-sm" : "bg-white text-gray-900 rounded-bl-sm border border-gray-100"
        }`}
      >
        <p className="leading-6">{msg.content}</p>
        <span className={`mt-1 block text-[11px] ${isMe ? "text-red-50/80" : "text-gray-400"}`}>{timeStr}</span>
      </div>
    </div>
  );
}

// --- MAIN PAGE ---

export default function ChatPage() {
  const { data: session } = useSession();
  const currentUserId = session?.user ? Number(session.user.id) : null;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputVal, setInputVal] = useState("");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Conversations + Setup Socket
  useEffect(() => {
    if (!currentUserId) return;

    // A. Fetch API
    fetch(`${SOCKET_URL}/chat/my-conversations?userId=${currentUserId}`)
        .then(res => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.json();
        })
        .then((data: unknown) => {
            if (!Array.isArray(data)) {
                console.error("API Error: Dữ liệu trả về không phải là mảng", data);
                return;
            }

            const rawData = data as RawConversation[];
            const mapped = rawData.map((c) => {
                const otherUser = c.student.id === currentUserId ? c.landlord : c.student;
                
                let lastMsg = "";
                if (c.messages && c.messages.length > 0) {
                    lastMsg = c.messages[c.messages.length - 1].content;
                }

                return {
                    id: c.id,
                    student: c.student,
                    landlord: c.landlord,
                    display_name: otherUser?.email || "Unknown User",
                    display_avatar: "", 
                    last_message: lastMsg
                };
            });

            setConversations(mapped);
            if(mapped.length > 0) setSelectedId(mapped[0].id);
        })
        .catch(err => console.error("Lỗi fetch chat:", err));

    // B. Socket
    socket = io(SOCKET_URL);
    socket.on("new_message", (newMsg: Message) => {
        setMessages(prev => [...prev, newMsg]); 
    });

    return () => {
        socket.disconnect();
    };
  }, [currentUserId]);


  // 2. Fetch Messages
  useEffect(() => {
      if (!selectedId) return;

      socket.emit("join_conversation", selectedId);

      fetch(`${SOCKET_URL}/chat/${selectedId}/messages`)
          .then(res => res.json())
          .then((data: Message[]) => setMessages(data))
          .catch(err => console.error(err));
      
  }, [selectedId]);


  // 3. Auto Scroll
  useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


  // 4. Send Message
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


  const currentConv = conversations.find(c => c.id === selectedId);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      
      {/* ✅ Thay TopBar cũ bằng UserTopBar */}
      <UserTopBar />

      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
        
        {/* Sidebar */}
        <aside className="w-full max-w-sm border-r border-gray-200 bg-white flex flex-col">
          <div className="flex items-center justify-between px-5 pt-4 pb-3">
            <h1 className="text-xl font-bold text-gray-900">Trò chuyện</h1>
            <div className="flex items-center gap-2 text-gray-500">
              <button className="rounded-full p-2 hover:bg-gray-100">
                <Pencil2Icon className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <div className="px-5 pb-3">
            <div className="flex items-center rounded-full bg-gray-100 px-3 py-2 gap-2">
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-500" />
              <input type="text" placeholder="Tìm kiếm..." className="w-full bg-transparent text-sm outline-none" />
            </div>
          </div>

          <div className="space-y-1 px-3 pb-4 overflow-y-auto flex-1">
            {conversations.map((c) => (
              <ConversationItem 
                key={c.id} 
                convo={c} 
                active={c.id === selectedId} 
                onSelect={() => setSelectedId(c.id)} 
              />
            ))}
            {conversations.length === 0 && (
                <div className="text-center text-gray-400 mt-10 text-sm">Chưa có cuộc trò chuyện nào</div>
            )}
          </div>
        </aside>

        {/* Main chat */}
        <section className="flex-1 flex flex-col bg-gray-50 relative">
          {currentConv ? (
             <>
                <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
                    <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 overflow-hidden rounded-full bg-gray-100 border flex items-center justify-center font-bold text-gray-500">
                         {currentConv.display_name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-base font-semibold text-gray-900">{currentConv.display_name}</h2>
                        <p className="text-xs text-green-500">Đang hoạt động</p>
                    </div>
                    </div>
                    <div className="flex items-center gap-3 text-gray-500">
                        <InfoCircledIcon className="h-5 w-5 cursor-pointer hover:text-gray-700" />
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 bg-gray-50">
                    <div className="text-center mb-4">
                        <span className="inline-flex items-center rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700">
                            Bắt đầu cuộc trò chuyện
                        </span>
                    </div>
                    
                    {messages.map((m, idx) => (
                        <MessageBubble key={idx} msg={m} isMe={m.sender.id === currentUserId} />
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                <div className="border-t border-gray-200 bg-white px-4 py-3">
                    <form onSubmit={handleSend} className="flex items-center gap-3">
                    <button type="button" className="rounded-full p-2 text-gray-500 hover:bg-gray-100">
                        <ImageIcon className="h-5 w-5" />
                    </button>
                    <input
                        type="text"
                        value={inputVal}
                        onChange={(e) => setInputVal(e.target.value)}
                        placeholder="Nhập tin nhắn..."
                        className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-red-300 transition"
                    />
                    <button
                        type="submit"
                        disabled={!inputVal.trim()}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500 text-white shadow hover:bg-red-600 disabled:bg-gray-300"
                    >
                        <PaperPlaneIcon className="h-5 w-5" />
                    </button>
                    </form>
                </div>
             </>
          ) : (
             <div className="flex flex-col items-center justify-center h-full text-gray-400">
                 <p className="text-lg font-semibold">Chào mừng đến với VLU Renting Chat</p>
                 <p className="text-sm">Chọn một cuộc hội thoại để bắt đầu</p>
             </div>
          )}
        </section>
      </div>
    </div>
  );
}