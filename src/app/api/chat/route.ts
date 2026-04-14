// -- /api/chat/route.ts
// -- Main chat endpoint -- frontend nundi messages receive chesi RAG response pampistundi
// -- user question ki ChromaDB nundi relevant context teskuni, OpenRouter LLM tho answer generate chestundi

import { NextRequest, NextResponse } from "next/server";
import { getRAGResponse } from "@/lib/rag";

// -- POST /api/chat -- user message receive chesi AI response return chestundi
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages } = body;

    // -- messages array validate
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "messages array required" }, { status: 400 });
    }

    // -- last message user di kavali (current question)
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== "user") {
      return NextResponse.json({ error: "Last message must be from user" }, { status: 400 });
    }

    // -- chat history (last message tappa migata anni) -- multi-turn conversation kosam
    const chatHistory = messages.slice(0, -1);

    // -- RAG pipeline call -- ChromaDB search + OpenRouter LLM
    const { answer, sources } = await getRAGResponse(lastMessage.content, chatHistory);

    return NextResponse.json({
      role: "assistant",
      content: answer,
      sources, // -- ["resume", "GitHub: repo-name"]
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to generate response", details: error.message },
      { status: 500 }
    );
  }
}
