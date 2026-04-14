// -- ChatWindow.tsx -- main chat component
// -- messages display, input field, booking widget, streaming responses
// -- idhi page.tsx lo render avthundi

"use client";

import { useState, useRef, useEffect } from "react";
import MessageBubble from "./MessageBubble";
import BookingWidget from "./BookingWidget";
import TypingIndicator from "./TypingIndicator";

// -- message type -- okko message ki role, content, optional sources
interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
}

export default function ChatWindow() {
  // -- state
  const [messages, setMessages] = useState<Message[]>([
    // -- initial welcome message
    {
      role: "assistant",
      content: "Hi! I'm Spoorthy's AI persona. Ask me anything about Spoorthy's skills, experience, projects, or education. I can also help you **book an interview**!",
    },
  ]);
  const [input, setInput] = useState(""); // -- user input text
  const [isLoading, setIsLoading] = useState(false); // -- AI response loading state
  const [showBooking, setShowBooking] = useState(false); // -- booking widget visible/hidden

  // -- auto-scroll to bottom when new messages arrive
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // -- message send chese function -- user input teskuni API call chestundi
  async function handleSend() {
    const text = input.trim();
    if (!text || isLoading) return;

    // -- user message add chestundi
    const userMessage: Message = { role: "user", content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    // -- booking related keywords detect chestundi
    const bookingKeywords = ["book", "schedule", "interview", "meeting", "calendar", "appointment", "slot"];
    const wantsBooking = bookingKeywords.some((kw) => text.toLowerCase().includes(kw));

    try {
      // -- /api/chat ki POST request -- RAG response teskuntundi
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();

      if (data.content) {
        // -- AI response add chestundi
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.content, sources: data.sources },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Sorry, I had trouble generating a response. Please try again." },
        ]);
      }

      // -- booking intent detect chesthe widget chupistundi
      if (wantsBooking) {
        setShowBooking(true);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Connection error. Please check if the server is running." },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  // -- Enter key press cheste message send avthundi
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // -- quick action buttons -- common questions shortcuts
  const quickActions = [
    "What are Spoorthy's skills?",
    "Tell me about projects",
    "Book an interview",
  ];

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto w-full">
      {/* -- chat messages area -- scrollable */}
      <div className="flex-1 overflow-y-auto chat-scroll py-4">
        {/* -- quick actions -- only show when few messages */}
        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-2 px-4 mb-4">
            {quickActions.map((action) => (
              <button
                key={action}
                onClick={() => { setInput(action); }}
                className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-full text-xs text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
              >
                {action}
              </button>
            ))}
          </div>
        )}

        {/* -- messages render */}
        {messages.map((msg, i) => (
          <MessageBubble key={i} role={msg.role} content={msg.content} sources={msg.sources} />
        ))}

        {/* -- typing indicator -- loading time lo show avthundi */}
        {isLoading && <TypingIndicator />}

        {/* -- booking widget -- booking intent detect chesthe show avthundi */}
        {showBooking && <BookingWidget onClose={() => setShowBooking(false)} />}

        {/* -- auto-scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* -- input area -- bottom lo pinned */}
      <div className="border-t border-gray-800 p-4">
        <div className="flex gap-2 items-end">
          {/* -- booking button */}
          <button
            onClick={() => setShowBooking(!showBooking)}
            className="p-2.5 bg-gray-800 border border-gray-700 rounded-xl hover:bg-gray-700 transition-colors shrink-0"
            title="Book Interview"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </button>

          {/* -- text input */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about Spoorthy's skills, projects, experience..."
            className="flex-1 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            disabled={isLoading}
          />

          {/* -- send button */}
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 rounded-xl transition-colors shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
