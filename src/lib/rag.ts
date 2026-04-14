// -- rag.ts
// -- RAG (Retrieval Augmented Generation) chain
// -- user question ki relevant context ChromaDB nundi teskuni, OpenRouter LLM ki pampi answer generate chestundi
// -- idhi chat API route lo use avthundi

import { getRetriever } from "./vectorstore";
import { buildChatPrompt } from "./prompts";

// -- LLM provider -- GROQ_API_KEY unte Groq (faster, better free tier)
// -- lekunte OpenRouter fallback
// -- Groq -- free tier lo Llama 3.3 70B with high rate limits + blazing fast inference
async function callLLM(
  messages: { role: string; content: string }[]
): Promise<string> {
  // -- Groq preferred if API key set
  if (process.env.GROQ_API_KEY) {
    return callGroq(messages);
  }
  return callOpenRouter(messages);
}

// -- Groq API -- OpenAI-compatible, super fast
async function callGroq(
  messages: { role: string; content: string }[]
): Promise<string> {
  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.3,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";
}

// -- OpenRouter fallback with model fallback chain
const OPENROUTER_FALLBACK_CHAIN = [
  process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free",
  "qwen/qwen3-next-80b-a3b-instruct:free",
  "google/gemma-3-27b-it:free",
  "z-ai/glm-4.5-air:free",
  "openai/gpt-oss-120b:free",
];

async function callOpenRouter(
  messages: { role: string; content: string }[]
): Promise<string> {
  const models = [...new Set(OPENROUTER_FALLBACK_CHAIN)];
  let lastError: string = "";

  for (const model of models) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          "X-Title": "AI Persona Scaler",
        },
        body: JSON.stringify({ model, messages, temperature: 0.3, max_tokens: 1000 }),
      });

      if (!response.ok) {
        const error = await response.text();
        lastError = `${model}: ${response.status} - ${error.slice(0, 200)}`;
        console.warn(`[OpenRouter] ${model} failed: ${response.status}, trying next...`);
        continue;
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      if (content) {
        console.log(`[OpenRouter] Used: ${model}`);
        return content;
      }
    } catch (err: any) {
      lastError = `${model}: ${err.message}`;
    }
  }
  throw new Error(`All OpenRouter models failed. Last: ${lastError}`);
}

// -- Main RAG function -- user message ki RAG-grounded response istundi
// -- Step 1: ChromaDB nundi relevant chunks retrieve chestundi
// -- Step 2: Chunks ni system prompt lo inject chestundi
// -- Step 3: OpenRouter LLM ki pampi answer generate chestundi
export async function getRAGResponse(
  userMessage: string,
  chatHistory: { role: string; content: string }[] = []
): Promise<{ answer: string; sources: string[] }> {
  // -- Step 1: ChromaDB nundi top 5 relevant chunks teskuntundi
  // -- user question ki semantically similar chunks vasthayi
  const retriever = await getRetriever(5);
  const retrievedDocs = await retriever.invoke(userMessage);

  // -- retrieved chunks ni oka string ga join chestundi
  // -- okko chunk ki source info kuda add chestundi (traceability kosam)
  const context = retrievedDocs
    .map((doc, i) => {
      const source = doc.metadata.source || "unknown";
      const repo = doc.metadata.repo ? ` (${doc.metadata.repo})` : "";
      return `[Source ${i + 1}: ${source}${repo}]\n${doc.pageContent}`;
    })
    .join("\n\n---\n\n");

  // -- source list extract chestundi (UI lo "Based on: resume, GitHub" chupinchadaniki)
  const sources = retrievedDocs.map((doc) => {
    if (doc.metadata.repo) return `GitHub: ${doc.metadata.repo}`;
    return doc.metadata.source || "unknown";
  });

  // -- Step 2: System prompt build chestundi with retrieved context
  const systemPrompt = buildChatPrompt(context);

  // -- Step 3: LLM ki messages prepare chesi call chestundi
  // -- chat history include chestundi (multi-turn conversation support kosam)
  // -- last 10 messages matrame teskuntundi (too long history LLM ki problem)
  const recentHistory = chatHistory.slice(-10);

  const messages = [
    { role: "system", content: systemPrompt },
    ...recentHistory,
    { role: "user", content: userMessage },
  ];

  // -- LLM call chesi answer teskuntundi (Groq preferred, OpenRouter fallback)
  const answer = await callLLM(messages);

  return { answer, sources: [...new Set(sources)] }; // -- duplicate sources remove chestundi
}

// -- Voice agent kosam simplified RAG -- short answers return chestundi
// -- voice lo long answers vinataniki kastam, so concise ga untundi
export async function getVoiceRAGResponse(query: string): Promise<string> {
  const { answer } = await getRAGResponse(query);
  // -- voice kosam first 500 characters matrame (too long voice ki suit avvadu)
  return answer.length > 500 ? answer.slice(0, 497) + "..." : answer;
}
