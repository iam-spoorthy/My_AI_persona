// -- ingest.ts
// -- ee script resume PDF + GitHub JSON data ni ChromaDB vector store lo load chestundi
// -- HuggingFace free embeddings use chestundi (zero cost!)
// -- FAISS local file-based vector store -- no server needed!
// -- RUN: npx tsx scripts/ingest.ts
// -- PREREQUISITE: data/resume.pdf + data/github_repos.json ready ga undali

import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { Document } from "@langchain/core/documents";

// -- .env.local nundi API keys load chestundi
dotenv.config({ path: ".env.local" });

async function main() {
  console.log("========================================");
  console.log("Data Ingestion Pipeline");
  console.log("ChromaDB + HuggingFace Embeddings (FREE!)");
  console.log("========================================\n");

  // ============================================================
  // STEP 1: Resume PDF load chestundi
  // -- pdf-parse library use chesi PDF ni plain text ga convert chestundi
  // -- nee resume.pdf data/ folder lo undali
  // ============================================================
  console.log("Step 1: Loading resume PDF...");
  const resumePath = path.join(process.cwd(), "data", "resume.pdf");

  if (!fs.existsSync(resumePath)) {
    console.error("ERROR: data/resume.pdf not found!");
    console.error("Nee resume PDF ni data/ folder lo pettu");
    process.exit(1);
  }

  // -- PDF read chesi text extract chestundi
  // -- dynamic import use chestunnam because pdf-parse CommonJS module
  // -- pdf-parse v1 -- simple function: buffer pass cheste text return chestundi
  // @ts-ignore -- ESM/CJS mismatch in IDE but works at runtime
  const pdfParse = require("pdf-parse");
  const pdfBuffer = fs.readFileSync(resumePath);
  const pdfData = await pdfParse(pdfBuffer);

  // -- PDF text ni LangChain Document format lo convert chestundi
  // -- metadata lo source: "resume" pettam -- later ekkada nundi vachindo track cheyadaniki
  const resumeDoc = new Document({
    pageContent: pdfData.text,
    metadata: { source: "resume", type: "resume" },
  });

  console.log(`  Resume loaded: ${pdfData.text.length} chars, ${pdfData.numpages} pages`);

  // ============================================================
  // STEP 2: GitHub repos JSON load chestundi
  // -- scrape-github.ts dwara generate ayina data read chestundi
  // -- okko repo ki structured text create chestundi
  // ============================================================
  console.log("\nStep 2: Loading GitHub repos data...");
  const githubPath = path.join(process.cwd(), "data", "github_repos.json");

  if (!fs.existsSync(githubPath)) {
    console.error("ERROR: data/github_repos.json not found!");
    console.error("Mundhu 'npx tsx scripts/scrape-github.ts' run cheyyi");
    process.exit(1);
  }

  const githubRepos = JSON.parse(fs.readFileSync(githubPath, "utf-8"));

  // -- okko repo ni Document ga convert chestundi
  // -- anni details structured format lo -- LLM ki easy ga artham avthundi
  const githubDocs = githubRepos.map(
    (repo: any) =>
      new Document({
        pageContent: [
          `Repository Name: ${repo.name}`,
          `Description: ${repo.description}`,
          `GitHub URL: ${repo.url}`,
          `Programming Languages: ${Object.keys(repo.languages).join(", ")}`,
          `Topics/Tags: ${repo.topics.join(", ")}`,
          `Stars: ${repo.stars}`,
          `README Content:\n${repo.readme}`,
        ].join("\n"),
        metadata: {
          source: "github",  // -- source tracking kosam
          repo: repo.name,   // -- ee repo nundi vachindi
          url: repo.url,     // -- direct GitHub link
        },
      })
  );

  console.log(`  Loaded ${githubDocs.length} GitHub repos`);

  // ============================================================
  // STEP 3: Documents ni chinna chunks ga split chestundi
  // -- WHY: peddha documents ki embedding oka average avthundi, specific
  //    details miss avthay. Chinna chunks lo split cheste precision ekkuva
  // -- chunkSize 800: okko chunk max 800 chars
  // -- chunkOverlap 200: chunks madhya 200 chars common (context continuity)
  // ============================================================
  console.log("\nStep 3: Splitting documents into chunks...");

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 800,
    chunkOverlap: 200,
  });

  const allDocs = [resumeDoc, ...githubDocs];
  const splitDocs = await textSplitter.splitDocuments(allDocs);

  console.log(`  Split into ${splitDocs.length} total chunks`);

  // ============================================================
  // STEP 4: Chunks ni embed chesi ChromaDB lo store chestundi
  // -- HuggingFace Inference API free ga embeddings generate chestundi
  // -- model: sentence-transformers/all-MiniLM-L6-v2 (384 dimensions, fast)
  // -- ChromaDB local persistent storage use chestundi
  // ============================================================
  console.log("\nStep 4: Embedding and storing in ChromaDB...");

  // -- HuggingFace free embeddings initialize
  // -- ee model text ni 384-dimensional vectors ga convert chestundi
  const embeddings = new HuggingFaceInferenceEmbeddings({
    apiKey: process.env.HUGGINGFACE_API_KEY,
    model: "sentence-transformers/all-MiniLM-L6-v2", // -- free, fast, good quality
  });

  const collectionName = process.env.CHROMA_COLLECTION || "ai-persona";

  // -- ChromaDB lo documents embed chesi store chestundi
  // -- fromDocuments: automatically embed + store chestundi
  await Chroma.fromDocuments(splitDocs, embeddings, {
    collectionName,
    url: process.env.CHROMA_URL, // -- undefined unte local mode use avthundi
  });

  console.log(`  Stored ${splitDocs.length} chunks in ChromaDB!`);

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log("\n========================================");
  console.log("Ingestion Complete! (Zero Cost)");
  console.log("========================================");
  console.log(`  Documents: ${allDocs.length} (1 resume + ${githubDocs.length} repos)`);
  console.log(`  Chunks: ${splitDocs.length}`);
  console.log(`  Vector Store: ChromaDB (collection: ${collectionName})`);
  console.log(`  Embeddings: HuggingFace all-MiniLM-L6-v2 (384 dim, FREE)`);
  console.log("\nNext: npx tsx scripts/test-rag.ts");
}

main().catch((error) => {
  console.error("Ingestion failed:", error);
  process.exit(1);
});
