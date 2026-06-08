"use client";
import { useState } from "react";
import { Send, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  from: "me" | "dispatch";
  text: string;
  time: string;
}

const SEED_MESSAGES: Message[] = [
  { id: "m1", from: "dispatch", text: "Good morning! Your trip has been assigned. Please proceed to Manila Port Area for pickup.", time: "6:00 AM" },
  { id: "m2", from: "me", text: "Copy that, on my way now. ETA 30 minutes.", time: "6:05 AM" },
  { id: "m3", from: "dispatch", text: "Noted. Client expects delivery before 10:30 AM. Drive safe!", time: "6:06 AM" },
  { id: "m4", from: "me", text: "Understood. Will update once loaded.", time: "6:07 AM" },
  { id: "m5", from: "dispatch", text: "Reminder: Please take photos of cargo before departing.", time: "6:30 AM" },
];

export function MessagesView({ userName }: { userName: string }) {
  const [messages, setMessages] = useState<Message[]>(SEED_MESSAGES);
  const [input, setInput] = useState("");

  function sendMessage() {
    if (!input.trim()) return;
    const msg: Message = {
      id: `m-${Date.now()}`,
      from: "me",
      text: input.trim(),
      time: new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, msg]);
    setInput("");
    // Simulate dispatch reply after 1.5s
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `m-${Date.now()}-reply`,
          from: "dispatch",
          text: "Received. Thanks for the update!",
          time: new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }, 1500);
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-8rem)]">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-navy flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm text-brand-navy">Dispatch Center</p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] text-gray-400">Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2 px-1 pb-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex",
              msg.from === "me" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
                msg.from === "me"
                  ? "bg-brand-teal text-white rounded-br-md"
                  : "bg-white border border-gray-100 text-gray-700 rounded-bl-md shadow-sm"
              )}
            >
              <p className="leading-relaxed">{msg.text}</p>
              <p className={cn(
                "text-[10px] mt-1",
                msg.from === "me" ? "text-white/60" : "text-gray-400"
              )}>
                {msg.time}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-gray-50 pt-2 pb-safe shrink-0">
        <div className="flex items-center gap-2 bg-white rounded-2xl border border-gray-200 shadow-sm px-4 py-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 text-sm bg-transparent outline-none placeholder:text-gray-400 min-h-[40px]"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all",
              input.trim()
                ? "bg-brand-teal text-white active:scale-95"
                : "bg-gray-100 text-gray-300"
            )}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
