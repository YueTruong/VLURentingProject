"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BellIcon,
  GearIcon,
  HamburgerMenuIcon,
  ImageIcon,
  InfoCircledIcon,
  Link2Icon,
  MagnifyingGlassIcon,
  MobileIcon,
  PaperPlaneIcon,
  Pencil2Icon,
  VideoIcon,
} from "@radix-ui/react-icons";

type Conversation = {
  id: string;
  name: string;
  subtitle: string;
  time: string;
  unread: number;
  avatar: string;
  tag?: string;
  status?: string;
  muted?: boolean;
};

type Message = {
  id: string;
  from: "me" | "them";
  text: string;
  time: string;
};

const conversations: Conversation[] = [
  {
    id: "c1",
    name: "Chủ nhà - Cơ sở 3",
    subtitle: "Bạn có thể ghé xem phòng chiều nay không?",
    time: "10:24",
    unread: 2,
    avatar: "/images/Admins.png",
    tag: "Chủ nhà",
    status: "Đang hoạt động",
  },
  {
    id: "c2",
    name: "Bạn Huy (đồng thuê)",
    subtitle: "Nhớ hỏi thêm về phí gửi xe nhé.",
    time: "09:10",
    unread: 0,
    avatar: "/images/Admins.png",
  },
  {
    id: "c3",
    name: "Quản trị viên",
    subtitle: "Cảm ơn bạn đã phản hồi.",
    time: "Hôm qua",
    unread: 0,
    avatar: "/images/Admins.png",
  },
  {
    id: "c4",
    name: "Nguyễn Văn A",
    subtitle: "Đã gửi một ảnh.",
    time: "CN",
    unread: 0,
    avatar: "/images/Admins.png",
    muted: true,
  },
];

const messages: Record<string, Message[]> = {
  c1: [
    { id: "m1", from: "them", text: "Chào bạn, bạn cần xem phòng khi nào?", time: "09:15" },
    { id: "m2", from: "me", text: "Chiều nay 15h mình ghé được nhé.", time: "09:16" },
    { id: "m3", from: "them", text: "Ok, mình sẽ đợi tại sảnh tòa nhà.", time: "09:17" },
  ],
  c2: [{ id: "m4", from: "them", text: "Nhớ hỏi thêm về phí gửi xe nhé.", time: "09:10" }],
};

function TopBar() {
  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        <Image src="/images/VLU-Renting-Logo.svg" alt="VLU Renting" width={140} height={52} className="object-contain" />
        <span className="hidden text-sm text-gray-500 sm:block">Trang web giúp sinh viên Văn Lang tìm nhà trọ phù hợp</span>
      </div>
      <div className="flex items-center gap-3">
        <Link aria-label="Thông báo" href="/notifications" className="rounded-full p-2 text-gray-500 hover:bg-gray-100">
          <BellIcon className="h-5 w-5" aria-hidden="true" />
        </Link>
        <Link aria-label="Cài đặt" href="/settings" className="rounded-full p-2 text-gray-500 hover:bg-gray-100">
          <GearIcon className="h-5 w-5" aria-hidden="true" />
        </Link>
        <div className="flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1">
          <div className="h-8 w-8 overflow-hidden rounded-full">
            <Image src="/images/Admins.png" alt="User" width={32} height={32} />
          </div>
          <span className="text-sm font-semibold text-gray-800 hidden sm:block">Admin</span>
        </div>
      </div>
    </header>
  );
}

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
      <div className="relative h-12 w-12 overflow-hidden rounded-full bg-gray-100">
        <Image src={convo.avatar} alt={convo.name} fill className="object-cover" />
      </div>
      <div className="flex-1 text-left">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-gray-900 line-clamp-1">{convo.name}</p>
          <span className="text-xs text-gray-400">{convo.time}</span>
        </div>
        <p className="text-xs text-gray-600 line-clamp-1">{convo.subtitle}</p>
      </div>
      {convo.unread > 0 && (
        <span className="rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-bold text-white">{convo.unread}</span>
      )}
    </button>
  );
}

function MessageBubble({ msg, avatar }: { msg: Message; avatar?: string }) {
  const isMe = msg.from === "me";
  return (
    <div className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
      {!isMe && avatar ? (
        <div className="relative h-8 w-8 overflow-hidden rounded-full bg-gray-100">
          <Image src={avatar} alt="Avatar" fill className="object-cover" />
        </div>
      ) : (
        !isMe && <div className="h-8 w-8 rounded-full bg-gray-100" />
      )}
      <div
        className={`max-w-[65%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
          isMe ? "bg-red-500 text-white rounded-br-sm" : "bg-white text-gray-900 rounded-bl-sm border border-gray-100"
        }`}
      >
        <p className="leading-6">{msg.text}</p>
        <span className={`mt-1 block text-[11px] ${isMe ? "text-red-50/80" : "text-gray-400"}`}>{msg.time}</span>
      </div>
      {isMe ? (
        <div className="relative h-8 w-8 overflow-hidden rounded-full bg-gray-100">
          <Image src="/images/Admins.png" alt="Me" fill className="object-cover" />
        </div>
      ) : null}
    </div>
  );
}

export default function ChatPage() {
  const [selected, setSelected] = useState(conversations[0].id);
  const conv = useMemo(() => conversations.find((c) => c.id === selected) ?? conversations[0], [selected]);
  const msgs = messages[selected] ?? [];

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-full max-w-sm border-r border-gray-200 bg-white">
          <div className="flex items-center justify-between px-5 pt-4 pb-3">
            <h1 className="text-xl font-bold text-gray-900">Trò chuyện</h1>
            <div className="flex items-center gap-2 text-gray-500">
              <button className="rounded-full p-2 hover:bg-gray-100" aria-label="Tạo hội thoại">
                <Pencil2Icon className="h-5 w-5" aria-hidden="true" />
              </button>
              <button className="rounded-full p-2 hover:bg-gray-100" aria-label="Bộ lọc">
                <HamburgerMenuIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="px-5 pb-3">
            <div className="flex items-center rounded-full bg-gray-100 px-3 py-2 gap-2">
              <span className="text-gray-500">
                <MagnifyingGlassIcon className="h-4 w-4" aria-hidden="true" />
              </span>
              <input
                type="text"
                placeholder="Tìm kiếm hội thoại..."
                className="w-full bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="space-y-1 px-3 pb-4 overflow-y-auto">
            {conversations.map((c) => (
              <ConversationItem key={c.id} convo={c} active={c.id === selected} onSelect={() => setSelected(c.id)} />
            ))}
          </div>
        </aside>

        {/* Main chat */}
        <section className="flex-1 flex flex-col bg-gray-50">
          <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 overflow-hidden rounded-full bg-gray-100">
                <Image src={conv.avatar} alt={conv.name} fill className="object-cover" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-gray-900">{conv.name}</h2>
                  {conv.tag ? (
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">{conv.tag}</span>
                  ) : null}
                </div>
                <p className="text-xs text-gray-500">{conv.status || "Hoạt động"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-500">
              <button className="rounded-full p-2 hover:bg-gray-100" aria-label="Gọi thoại">
                <MobileIcon className="h-5 w-5" aria-hidden="true" />
              </button>
              <button className="rounded-full p-2 hover:bg-gray-100" aria-label="Gọi video">
                <VideoIcon className="h-5 w-5" aria-hidden="true" />
              </button>
              <button className="rounded-full p-2 hover:bg-gray-100" aria-label="Thông tin">
                <InfoCircledIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 bg-gray-50">
            <div className="text-center">
              <span className="inline-flex items-center rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700">
                Hôm nay, 15:00
              </span>
            </div>
            {msgs.map((m) => (
              <MessageBubble key={m.id} msg={m} avatar={conv.avatar} />
            ))}
          </div>

          <div className="border-t border-gray-200 bg-white px-4 py-3">
            <form className="flex items-center gap-3">
              <button type="button" className="rounded-full p-2 text-gray-500 hover:bg-gray-100" aria-label="Đính kèm">
                <Link2Icon className="h-5 w-5" aria-hidden="true" />
              </button>
              <button type="button" className="rounded-full p-2 text-gray-500 hover:bg-gray-100" aria-label="Chèn ảnh">
                <ImageIcon className="h-5 w-5" aria-hidden="true" />
              </button>
              <input
                type="text"
                placeholder="Nhập tin nhắn..."
                className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-300"
              />
              <button
                type="submit"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500 text-white shadow hover:bg-red-600 active:scale-95"
                aria-label="Gửi"
              >
                <PaperPlaneIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
