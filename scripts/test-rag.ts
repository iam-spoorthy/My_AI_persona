// -- test-rag.ts
// -- ee script RAG pipeline sarigga pani chestundo test chestundi
// -- ChromaDB nundi relevant chunks retrieve avthunnayo check chestundi
// -- RUN: npx tsx scripts/test-rag.ts
// -- PREREQUISITE: ingest.ts already run chesi undali + ChromaDB server running undali

import * as dotenv from "dotenv";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { Chroma } from "@langchain/community/vectorstores/chroma";

// -- .env.local nundi API keys load chestundi
dotenv.config({ path: ".env.local" });

async function main() {
  console.log("========================================");
  console.log("RAG Pipeline Test");
  console.log("========================================\n");

  // -- same embeddings model use cheyali ingest lo use chesindi (MiniLM)
  // -- different model vadite vectors match avvavu!
  const embeddings = new HuggingFaceInferenceEmbeddings({
    apiKey: process.env.HUGGINGFACE_API_KEY,
    model: "sentence-transformers/all-MiniLM-L6-v2",
  });

  // -- ChromaDB nundi already stored collection connect chestundi
  const collectionName = process.env.CHROMA_COLLECTION || "ai-persona";
  const vectorStore = await Chroma.fromExistingCollection(embeddings, {
    collectionName,
    url: process.env.CHROMA_URL || "http://localhost:8000",
  });

  // -- retriever create -- k=5 ante top 5 relevant chunks return chestundi
  const retriever = vectorStore.asRetriever({ k: 5 });

  // -- ee questions tho test chestam -- nee data ki relevant results ravali
  const testQueries = [
    "What programming languages does Spoorthy know?",
    "Tell me about the GitHub projects",
    "What is Spoorthy's education background?",
    "What experience does Spoorthy have?",
    "Why should we hire Spoorthy?",
  ];

  // -- okko query ki relevant chunks retrieve chesi print chestundi
  for (const query of testQueries) {
    console.log(`\nQuery: "${query}"`);
    console.log("-".repeat(60));

    // -- similarity search -- question ki closest matching chunks teskuntundi
    const results = await retriever.invoke(query);

    if (results.length === 0) {
      console.log("  No results! ingest.ts sarigga run ayyindo check cheyyi");
    } else {
      results.forEach((doc, i) => {
        const source = doc.metadata.source || "unknown";
        const repo = doc.metadata.repo || "";
        const preview = doc.pageContent.slice(0, 150).replace(/\n/g, " ");
        console.log(`  [${i + 1}] Source: ${source}${repo ? ` (${repo})` : ""}`);
        console.log(`      ${preview}...`);
      });
    }
  }

  console.log("\n========================================");
  console.log("Test Complete!");
  console.log("========================================");
  console.log("Results nee resume/GitHub ki relevant ga undali.");
  console.log("Wrong results vasthe, check: resume content, GitHub repos data");
}

main().catch((error) => {
  console.error("RAG test failed:", error);
  process.exit(1);
});
