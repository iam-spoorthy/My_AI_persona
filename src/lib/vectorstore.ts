// -- vectorstore.ts
// -- ChromaDB vector store connection singleton
// -- ee module oka saari initialize chesi, anni API routes lo reuse chestundi
// -- RAG retrieval kosam ee vector store vadutam

import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { Chroma } from "@langchain/community/vectorstores/chroma";

// -- singleton pattern -- oka saari create chesthe reuse avthundi
// -- prathi API request ki kotta connection create cheyyakudadu (slow avthundi)
let vectorStoreInstance: Chroma | null = null;

// -- ChromaDB vector store instance return chese function
// -- already create chesthe cached instance istundi, lekunte kotta instance create chestundi
export async function getVectorStore(): Promise<Chroma> {
  if (vectorStoreInstance) {
    return vectorStoreInstance;
  }

  // -- HuggingFace free embeddings -- ingest lo vadina same model vadali
  // -- different model vadite vectors match avvavu, search pani cheyyadu
  const embeddings = new HuggingFaceInferenceEmbeddings({
    apiKey: process.env.HUGGINGFACE_API_KEY,
    model: "sentence-transformers/all-MiniLM-L6-v2",
  });

  // -- ChromaDB ki connect chesi existing collection teskuntundi
  const collectionName = process.env.CHROMA_COLLECTION || "ai-persona";
  vectorStoreInstance = await Chroma.fromExistingCollection(embeddings, {
    collectionName,
    url: process.env.CHROMA_URL || "http://localhost:8000",
  });

  return vectorStoreInstance;
}

// -- retriever return chese helper function
// -- k = enni relevant chunks kavalo (default 5)
export async function getRetriever(k: number = 5) {
  const store = await getVectorStore();
  return store.asRetriever({ k });
}
