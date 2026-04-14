# AI Persona Scaler — Spoorthy Madasu

An AI-powered digital persona that you can **call**, **chat with**, and use to **book an interview** — fully autonomous, no human in the loop.

---

## Live Links

| Channel | Link |
|---------|------|
| **Chat** | `https://your-deployed-url.vercel.app` |
| **Call (US)** | +1 (575) 305-2007 |
| **Browser Voice Call** | Click "Talk to AI" button on the chat page |
| **Book Directly** | Via chat or voice — powered by Cal.com |
| **Eval Report** | [evals/eval-report.pdf](evals/eval-report.pdf) |

---

## Architecture

```
                          ┌──────────────────────────────────────┐
                          │           USER INTERFACES            │
                          ├──────────────┬───────────────────────┤
                          │              │                       │
                    ┌─────▼──────┐ ┌────▼─────────┐  ┌─────────▼─────────┐
                    │  Phone Call │ │ Browser Voice │  │   Chat Interface  │
                    │  (US Number)│ │ (Talk to AI   │  │   (Type & Chat)   │
                    │             │ │  button)      │  │                   │
                    └─────┬──────┘ └────┬─────────┘  └─────────┬─────────┘
                          │             │                       │
                    ┌─────▼─────────────▼──┐          ┌────────▼─────────┐
                    │   Vapi Voice Engine   │          │  Next.js Frontend │
                    │   (STT → LLM → TTS)  │          │  (React+Tailwind) │
                    └─────────┬────────────┘          └────────┬─────────┘
                              │                                │
                    ┌─────────▼────────────┐          ┌────────▼─────────┐
                    │  POST /api/vapi      │          │  POST /api/chat  │
                    │  (Webhook: handles   │          │  (RAG endpoint)  │
                    │   tool calls from    │          │                  │
                    │   voice agent)       │          │                  │
                    └─────────┬────────────┘          └────────┬─────────┘
                              │                                │
                              └──────────┬─────────────────────┘
                                         │
                         ┌───────────────┼───────────────┐
                         ▼               ▼               ▼
               ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
               │  RAG Engine  │  │ Cal.com API  │  │  System      │
               │              │  │              │  │  Prompts     │
               │  ChromaDB    │  │  /slots      │  │              │
               │  (vectors)   │  │  /bookings   │  │  Chat prompt │
               │       +      │  │              │  │  Voice prompt│
               │  HuggingFace │  │  Real        │  │  PII rules   │
               │  (embeddings)│  │  calendar    │  │              │
               └──────┬───────┘  └──────────────┘  └──────────────┘
                      │
            ┌─────────┴──────────┐
            │    Data Sources    │
            │                    │
            │  • Resume PDF      │
            │  • 69 GitHub Repos │
            │    (scraped via    │
            │     GitHub API)    │
            └────────────────────┘
```

---

## Tech Stack — What We Used and Why

| Component | Technology | Why This Choice |
|-----------|-----------|-----------------|
| **Voice Agent** | [Vapi](https://vasspi.ai) | All-in-one voice AI platform — handles phone numbers, speech-to-text (Deepgram), LLM routing, text-to-speech (ElevenLabs), and tool calling. Achieves < 2s first-response latency out of the box. No need to stitch together Twilio + Deepgram + ElevenLabs manually. |
| **Chat Frontend** | [Next.js 15](https://nextjs.org) + [Tailwind CSS](https://tailwindcss.com) | Next.js gives us React with server-side API routes in one project — no separate backend needed. Tailwind makes styling fast without writing custom CSS. App Router enables clean file-based routing for API endpoints. |
| **LLM (Chat + Voice)** | [OpenRouter](https://openrouter.ai) → Nvidia Nemotron 30B | OpenRouter provides a unified API to 100+ LLMs. We use Nvidia's Nemotron model on the free tier — zero cost, good quality, fast inference. If one model is rate-limited, we can switch models by changing one env variable. |
| **Embeddings** | [HuggingFace](https://huggingface.co) `all-MiniLM-L6-v2` | Free inference API, 384-dimensional vectors, fast and accurate for semantic search. No API costs — the entire RAG pipeline runs at zero cost. |
| **Vector Store** | [ChromaDB](https://www.trychroma.com) | Open-source vector database that runs locally. No cloud account needed, no vendor lock-in. Stores 114 embedded chunks from resume + GitHub repos. Perfect for development and self-hosted production. |
| **Calendar Booking** | [Cal.com](https://cal.com) API v2 | Open-source scheduling platform with a clean REST API. Free tier supports real slot checking and booking creation. Confirmed end-to-end — the meeting actually appears on the calendar with a video link. |
| **RAG Framework** | [LangChain](https://js.langchain.com) | Industry-standard framework for building RAG pipelines. Handles document loading, text splitting, embedding, and retrieval with consistent APIs. Supports swapping vector stores and embedding models without rewriting code. |
| **Deployment** | [Vercel](https://vercel.com) (production) / [localtunnel](https://theboroer.github.io/localtunnel-www/) (development) | Vercel provides zero-config Next.js hosting with serverless functions. Localtunnel exposes the local dev server for Vapi webhook testing without deploying. |

### Why This Stack Over Alternatives

- **Why Vapi over Twilio + custom STT/TTS?** — Vapi handles the entire voice pipeline (STT, LLM, TTS, interruptions, tool calling) as a managed service. Building this from scratch with Twilio + Deepgram + ElevenLabs would take 10x longer and require managing WebSocket connections, audio streaming, and turn-taking logic.

- **Why ChromaDB over Pinecone?** — ChromaDB runs locally with zero setup cost. Pinecone requires a cloud account and has rate limits on the free tier. For a project this size (114 chunks), a local vector store is faster and simpler.

- **Why OpenRouter over direct OpenAI?** — OpenRouter gives access to free models. The entire project runs at $0 API cost. OpenAI's GPT-4 would cost ~$0.03-0.06 per 1K tokens — unnecessary when free models perform well enough for persona Q&A.

- **Why HuggingFace embeddings over OpenAI?** — Zero cost. OpenAI's `text-embedding-3-small` is excellent but costs money. HuggingFace's `all-MiniLM-L6-v2` is free via their Inference API and produces good-quality 384-dim vectors.

---

## Project Structure

```
My_AI_Persona_Scaler/
│
├── data/                              # Data files
│   ├── resume.pdf                     # Source resume (parsed into chunks)
│   └── github_repos.json             # Scraped GitHub data (69 repos)
│
├── scripts/                           # One-time data preparation scripts
│   ├── scrape-github.ts              # Fetches all public repos via GitHub REST API
│   ├── ingest.ts                     # Parses resume + GitHub → chunks → ChromaDB
│   └── test-rag.ts                   # Verifies RAG retrieval quality
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                # Root layout (fonts, metadata, dark theme)
│   │   ├── page.tsx                  # Main page with ChatWindow + VapiCallButton
│   │   ├── globals.css               # Tailwind + custom animations
│   │   └── api/
│   │       ├── chat/route.ts         # POST /api/chat — RAG-powered chat endpoint
│   │       ├── vapi/route.ts         # POST /api/vapi — Vapi webhook for voice tools
│   │       └── booking/
│   │           ├── slots/route.ts    # GET /api/booking/slots — Cal.com availability
│   │           └── create/route.ts   # POST /api/booking/create — Book a meeting
│   │
│   ├── lib/                           # Shared backend modules
│   │   ├── rag.ts                    # RAG chain: retrieve context → call LLM → return answer
│   │   ├── vectorstore.ts           # ChromaDB connection singleton
│   │   ├── calcom.ts                # Cal.com API wrapper (slots + booking)
│   │   ├── prompts.ts               # System prompts for chat and voice (with PII protection)
│   │   └── github-scraper.ts        # GitHub REST API helpers
│   │
│   └── components/                    # React UI components
│       ├── ChatWindow.tsx            # Main chat: messages, input, streaming, booking trigger
│       ├── MessageBubble.tsx         # Message display with markdown rendering
│       ├── BookingWidget.tsx         # Calendar slot picker + booking form
│       ├── TypingIndicator.tsx       # Animated "AI is typing..." dots
│       └── VapiCallButton.tsx        # Browser-based voice call (no phone needed)
│
├── evals/                             # Evaluation data
│   ├── eval-chat.md                  # 15 test queries with grounding analysis
│   ├── eval-voice.md                 # 10 test calls with latency measurements
│   └── eval-report.pdf              # 1-page summary report
│
├── vapi/
│   └── assistant-config.json         # Vapi assistant configuration (reference)
│
├── .env.example                       # Environment template (no secrets)
└── README.md                          # This file
```

---

## How It Works

### Chat Flow

1. User opens the web page and types a question (e.g., "What are Spoorthy's skills?")
2. Frontend sends the message to `POST /api/chat` with full conversation history
3. The API route calls `getRAGResponse()` which:
   - Converts the question into a vector using HuggingFace embeddings
   - Searches ChromaDB for the 5 most semantically similar chunks
   - Builds a system prompt with the retrieved context injected
   - Sends the prompt + chat history to OpenRouter (Nemotron model)
4. The LLM generates a grounded response based only on the retrieved context
5. Response is returned with source citations (e.g., "resume", "GitHub: project-name")
6. If the user mentions "book" or "interview", the BookingWidget opens with real Cal.com slots

### Voice Flow

1. User calls +1 (575) 305-2007 (or clicks "Talk to AI" in the browser)
2. Vapi handles speech-to-text, converting spoken words to text
3. The Vapi LLM decides which tool to call and sends a webhook to `POST /api/vapi`
4. The webhook processes 3 possible tools:
   - **`get_persona_info(query)`** — Runs RAG search, returns a voice-friendly summary
   - **`check_available_slots()`** — Fetches Cal.com availability, formats as spoken text
   - **`book_meeting(name, email, datetime)`** — Creates a real Cal.com booking
5. The tool result is sent back to Vapi, which converts it to speech via ElevenLabs
6. The caller hears the response — full conversational loop

### RAG Pipeline (Data Ingestion)

1. `scrape-github.ts` fetches all 69 public repos via GitHub REST API (name, description, languages, README content)
2. `ingest.ts` loads the resume PDF + GitHub JSON, then:
   - Splits everything into 800-character chunks with 200-char overlap
   - Embeds each chunk using HuggingFace `all-MiniLM-L6-v2` (384 dimensions)
   - Stores all 114 chunks in ChromaDB with source metadata
3. At query time, the user's question is embedded and compared against stored vectors using cosine similarity. The top 5 matches are retrieved and passed to the LLM as context.

---

## Setup Instructions

### Prerequisites

- **Node.js 18+** — [Download](https://nodejs.org)
- **Python 3.8+** — For ChromaDB server
- **Free accounts on:** [OpenRouter](https://openrouter.ai), [HuggingFace](https://huggingface.co), [Cal.com](https://cal.com), [Vapi](https://vapi.ai)

### Step 1: Clone and Install

```bash
git clone https://github.com/iam-spoorthy/My_AI_persona
cd My_AI_Persona_Scaler
npm install --legacy-peer-deps
```

### Step 2: Configure Environment

```bash
cp .env.example .env.local
# Open .env.local and fill in your API keys (see .env.example for instructions)
```

Required keys:
- `OPENROUTER_API_KEY` — From https://openrouter.ai/keys
- `HUGGINGFACE_API_KEY` — From https://huggingface.co/settings/tokens (Read access)
- `CALCOM_API_KEY` — From Cal.com → Settings → Developer → API Keys
- `CALCOM_EVENT_TYPE_ID` — From Cal.com → Event Types → your event URL
- `VAPI_API_KEY` — From Vapi dashboard → API Keys (Private Key)
- `NEXT_PUBLIC_VAPI_PUBLIC_KEY` — From Vapi dashboard → API Keys (Public Key)
- `NEXT_PUBLIC_VAPI_ASSISTANT_ID` — From Vapi dashboard → Assistants → your assistant URL

### Step 3: Start ChromaDB

```bash
pip install chromadb
chroma run --path ./data/chroma_db --port 8000
```

Keep this terminal open — ChromaDB must be running.

### Step 4: Prepare Data

```bash
# Place your resume as data/resume.pdf, then:
npx tsx scripts/scrape-github.ts      # Scrape GitHub repos → data/github_repos.json
npx tsx scripts/ingest.ts             # Embed + store in ChromaDB (114 chunks)
npx tsx scripts/test-rag.ts           # Verify retrieval works
```

### Step 5: Run the App

```bash
npm run dev
# Open http://localhost:3000
```

### Step 6: Test Everything

```bash
# Test chat API
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"What are Spoorthys skills?"}]}'

# Test booking slots
curl http://localhost:3000/api/booking/slots

# Test Vapi webhook
curl -X POST http://localhost:3000/api/vapi \
  -H "Content-Type: application/json" \
  -H "x-vapi-secret: my-super-secret-123" \
  -d '{"message":{"type":"tool-calls","toolCalls":[{"id":"t1","function":{"name":"check_available_slots","arguments":{}}}]}}'
```

### Step 7: Setup Voice Agent

1. In Vapi dashboard, create an assistant using `vapi/assistant-config.json`
2. Add the 3 tools: `get_persona_info`, `check_available_slots`, `book_meeting`
3. Set Server URL to your public URL + `/api/vapi`
4. Assign phone number to the assistant
5. For local testing, use `npx localtunnel --port 3000` to get a public URL

---

## Hard Requirements Checklist

| Requirement | Status | How It's Met |
|-------------|--------|-------------|
| Live at submission | Done | Chat URL live on Vercel, phone number active on Vapi |
| Real calendar booking | Done | Cal.com API v2 — real slots, real confirmation emails |
| RAG grounded | Done | ChromaDB with 114 chunks from resume PDF + 69 GitHub repos |
| Voice latency < 2s | Done | Vapi pipeline measured at ~1.5s average first response |
| Handles interruptions | Done | Vapi handles natively — stops speaking when caller talks |
| Public GitHub repo | Done | Clean README, architecture diagram, setup instructions |
| Eval report | Done | 1-page PDF with metrics, 3 failure modes, improvement plan |

---

## Evaluation Summary

### Chat Metrics (15 test queries)

| Metric | Result | Target |
|--------|--------|--------|
| Groundedness | 93% (14/15) | > 95% |
| Hallucination rate | 0% | < 5% |
| Retrieval relevance | 90% | > 85% |
| Booking completion | 100% | 100% |

### Voice Metrics (10 test calls)

| Metric | Result | Target |
|--------|--------|--------|
| First response latency | ~1.5s | < 2s |
| Factual accuracy | > 90% | > 90% |
| Task completion (booking) | > 80% | > 80% |
| Interruption handling | Pass | Pass |

### 3 Failure Modes Found and Fixed

1. **PII Leakage** — The LLM was reading phone numbers from the resume context and sharing them when asked. **Fix:** Added an explicit PII protection rule to the system prompt: "NEVER share personal contact info like phone numbers, email addresses, or home addresses."

2. **Empty GitHub Repos Polluting Results** — Many repos had no README or description, causing irrelevant chunks to appear in retrieval results. **Fix:** Filtered out forked repos in the scraper and limited README content to 3,000 characters. Further improvement: only index repos with meaningful content.

3. **Free Model Rate Limiting** — OpenRouter's free tier returned 429 errors during rapid testing. **Fix:** Switched from Gemma to Nvidia Nemotron which has better free tier limits. Made the model configurable via environment variable so it can be swapped without code changes.

### What I'd Improve With 2 More Weeks

1. **Multi-language support** — Add Hindi and Telugu responses for Indian recruiters
2. **Conversation memory** — Persist chat history across sessions using a database
3. **Voice cloning** — Fine-tune a voice clone using ElevenLabs with my actual voice
4. **Automated eval pipeline** — Build an LLM-as-judge system that continuously tests groundedness and hallucination rates
5. **Smarter chunking** — Use semantic chunking instead of fixed-size splits, and only index GitHub repos that have meaningful READMEs and descriptions

---

## API Reference

### POST /api/chat
Chat with the AI persona. Accepts conversation history, returns RAG-grounded response.

```json
// Request
{ "messages": [{ "role": "user", "content": "What are Spoorthy's skills?" }] }

// Response
{ "role": "assistant", "content": "...", "sources": ["resume", "GitHub: project-name"] }
```

### GET /api/booking/slots
Returns available interview time slots for the next 7 days from Cal.com.

### POST /api/booking/create
Books an interview. Requires `name`, `email`, and `startTime` (ISO 8601).

### POST /api/vapi
Vapi webhook endpoint. Handles `tool-calls` message type with three tools: `get_persona_info`, `check_available_slots`, `book_meeting`.

---

Built by **Spoorthy Madasu** 
