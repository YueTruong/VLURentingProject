"use client";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

let socket: any;

export default function ChatBox({ conversationId, currentUserId }: { conversationId: string, currentUserId: number }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    // 1. Kết nối tới Server Socket (Port 3001)
    socket = io("http://localhost:3001");

    // 2. Join vào phòng chat
    socket.emit("join_room", conversationId);

    // 3. Lắng nghe tin nhắn mới từ Server gửi về
    socket.on("receive_message", (data: any) => {
      setMessages((prev) => [...prev, data]);
    });

    // Cleanup khi tắt component
    return () => {
      socket.disconnect();
    };
  }, [conversationId]);

  const sendMessage = () => {
    if (input.trim() === "") return;

    const messageData = {
      conversationId,
      senderId: currentUserId,
      content: input,
    };

    // Gửi lên server
    socket.emit("send_message", messageData);
    setInput("");
  };

  return (
    <div className="p-4 border rounded-lg w-96">
      <div className="h-64 overflow-y-scroll border-b mb-4 p-2 bg-gray-50">
        {messages.map((msg, index) => (
          <div key={index} className={`mb-2 ${msg.senderId === currentUserId ? 'text-right' : 'text-left'}`}>
            <span className={`inline-block p-2 rounded ${msg.senderId === currentUserId ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}>
              {msg.content}
            </span>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          className="border p-2 flex-1 rounded"
          placeholder="Nhập tin nhắn..."
        />
        <button onClick={sendMessage} className="bg-blue-600 text-white p-2 rounded">Gửi</button>
      </div>
    </div>
  );
}