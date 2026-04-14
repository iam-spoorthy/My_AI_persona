// -- page.tsx -- main page -- ChatWindow render chestundi
// -- user ee page open chesthe chat interface chupistundi

import ChatWindow from "@/components/ChatWindow";
import VapiCallButton from "@/components/VapiCallButton";

export default function Home() {
  return (
    <div className="flex flex-col h-screen bg-gray-950">
      {/* -- header with voice call button */}
      <header className="border-b border-gray-800 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-white">Spoorthy&apos;s AI Persona</h1>
            <p className="text-xs text-gray-400">Chat or call &bull; Ask about skills, projects &bull; Book an interview</p>
          </div>
          {/* -- browser nundi voice call button -- phone avasaram ledu! */}
          <VapiCallButton />
        </div>
      </header>

      {/* -- chat window -- takes remaining height */}
      <ChatWindow />
    </div>
  );
}
