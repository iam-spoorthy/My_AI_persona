// -- MessageBubble.tsx -- okko message ni bubble ga display chese component
// -- user messages right side (blue), AI messages left side (gray)

import ReactMarkdown from "react-markdown";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  sources?: string[]; // -- RAG sources (optional, assistant messages kosam)
}

export default function MessageBubble({ role, content, sources }: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <div className={`animate-fade-in flex ${isUser ? "justify-end" : "justify-start"} px-4 py-1`}>
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
        isUser
          ? "bg-blue-600 text-white"            // -- user message: right, blue
          : "bg-gray-800 text-gray-100"          // -- AI message: left, gray
      }`}>
        {/* -- AI messages markdown support -- bold, links, lists render avthay */}
        {isUser ? (
          <p className="text-sm leading-relaxed">{content}</p>
        ) : (
          <div className="text-sm leading-relaxed prose prose-invert prose-sm max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}

        {/* -- sources display -- ekkada nundi info vachindo chupistundi */}
        {sources && sources.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-700">
            <p className="text-xs text-gray-400">
              Sources: {sources.join(", ")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
