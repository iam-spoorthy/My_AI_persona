// -- VapiCallButton.tsx -- Browser nundi voice call chese button
// -- Phone avasaram ledu! India nundi kuda work avthundi
// -- Vapi Web SDK use chesi browser microphone tho direct call chestundi

"use client";

import { useState, useEffect, useRef } from "react";

export default function VapiCallButton() {
  const [callStatus, setCallStatus] = useState<"idle" | "connecting" | "active" | "ending">("idle");
  const [isMuted, setIsMuted] = useState(false);
  const vapiRef = useRef<any>(null);

  // -- Vapi instance create chestundi (lazy load -- first click lo load avthundi)
  async function getVapi() {
    if (vapiRef.current) return vapiRef.current;

    const Vapi = (await import("@vapi-ai/web")).default;
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;

    if (!publicKey || publicKey === "your-vapi-public-key-here") {
      alert("Vapi Public Key not set! .env.local lo NEXT_PUBLIC_VAPI_PUBLIC_KEY add cheyyi.");
      return null;
    }

    const vapi = new Vapi(publicKey);

    // -- call lifecycle events listen chestundi
    vapi.on("call-start", () => setCallStatus("active"));
    vapi.on("call-end", () => { setCallStatus("idle"); setIsMuted(false); });
    vapi.on("error", (e: any) => { console.error("Vapi error:", e); setCallStatus("idle"); });

    vapiRef.current = vapi;
    return vapi;
  }

  // -- call start chese function
  async function startCall() {
    const vapi = await getVapi();
    if (!vapi) return;

    setCallStatus("connecting");

    try {
      const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;

      if (assistantId && assistantId !== "your-assistant-id-here") {
        // -- Vapi dashboard lo create chesina assistant use chestundi
        // -- dashboard lo server URL correct ga set undali (localtunnel/Vercel URL)
        await vapi.start(assistantId);
      } else {
        // -- assistant ID lekunte inline config -- ee server URL Vapi cloud nundi accessible undali
        const serverUrl = process.env.NEXT_PUBLIC_VAPI_SERVER_URL || `${window.location.origin}/api/vapi`;

        await vapi.start({
          transcriber: {
            provider: "deepgram",
            model: "nova-2",
            language: "en-US",
          },
          model: {
            provider: "openai",
            model: "gpt-4o-mini",
            temperature: 0.3,
            messages: [
              {
                role: "system",
                content: "You are the AI voice representative of Spoorthy Madasu on a phone call. Be warm, professional, and concise. Use the get_persona_info tool to answer questions. Offer to book interviews. Never fabricate info.",
              },
            ],
            tools: [
              {
                type: "function",
                function: {
                  name: "get_persona_info",
                  description: "Look up Spoorthy's background, skills, projects",
                  parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] },
                },
                server: { url: serverUrl },
              },
              {
                type: "function",
                function: {
                  name: "check_available_slots",
                  description: "Check available interview time slots",
                  parameters: { type: "object", properties: {} },
                },
                server: { url: serverUrl },
              },
              {
                type: "function",
                function: {
                  name: "book_meeting",
                  description: "Book an interview with Spoorthy",
                  parameters: {
                    type: "object",
                    properties: { name: { type: "string" }, email: { type: "string" }, datetime: { type: "string" } },
                    required: ["name", "email", "datetime"],
                  },
                },
                server: { url: serverUrl },
              },
            ],
          },
          voice: {
            provider: "11labs",
            voiceId: "pNInz6obpgDQGcFmaJgB",
          },
          firstMessage: "Hi! I'm Spoorthy's AI representative. I can tell you about skills, experience, projects, and help you book an interview. What would you like to know?",
        });
      }
    } catch (err: any) {
      console.error("Failed to start call:", err);
      setCallStatus("idle");
    }
  }

  // -- call end chese function
  async function endCall() {
    const vapi = vapiRef.current;
    if (vapi) {
      setCallStatus("ending");
      vapi.stop();
    }
  }

  // -- mute/unmute
  function toggleMute() {
    const vapi = vapiRef.current;
    if (vapi) {
      vapi.setMuted(!isMuted);
      setIsMuted(!isMuted);
    }
  }

  // -- cleanup on unmount
  useEffect(() => {
    return () => { vapiRef.current?.stop(); };
  }, []);

  return (
    <div className="flex items-center gap-2">
      {callStatus === "idle" ? (
        <button
          onClick={startCall}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-full text-sm font-medium transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
          Talk to AI
        </button>
      ) : callStatus === "connecting" ? (
        <button disabled className="flex items-center gap-2 px-4 py-2 bg-yellow-600 rounded-full text-sm font-medium animate-pulse">
          Connecting...
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-xs text-green-400">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Live
          </span>
          <button
            onClick={toggleMute}
            className={`p-2 rounded-full text-sm ${isMuted ? "bg-yellow-600" : "bg-gray-700"} hover:bg-gray-600`}
          >
            {isMuted ? "Unmute" : "Mute"}
          </button>
          <button
            onClick={endCall}
            className="flex items-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-full text-sm font-medium transition-colors"
          >
            End Call
          </button>
        </div>
      )}
    </div>
  );
}
