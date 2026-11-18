"""
RAG Engine for Citation-Anchored Brand Guideline Retrieval
Uses ChromaDB for semantic search with Google Gemini embeddings (via google-genai SDK)
"""

import os
from typing import List, Dict, Optional
import chromadb
import hashlib
from dotenv import load_dotenv
import json

# Load environment variables
load_dotenv()

# Use the new google-genai SDK
from google import genai
from google.genai import types

class RAGEngine:
    def __init__(self, chroma_persist_dir: str = "./chroma_db"):
        """Initialize ChromaDB and Gemini client"""
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")

        # Initialize google-genai client
        self.client = genai.Client(api_key=self.api_key)

        # Embedding model - gemini-embedding-001 is available on this API key
        self.embedding_model = "gemini-embedding-001"
        # Generation model candidates with fallback
        self.gen_models = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-3.8-flash"]

        # Initialize ChromaDB with PersistentClient (new API, replaces deprecated Settings)
        self.chroma_client = chromadb.PersistentClient(path=chroma_persist_dir)

    def create_guideline_collection(self, guideline_id: str) -> chromadb.Collection:
        """Create or get collection for a specific brand guideline"""
        collection_name = f"guideline_{guideline_id}"
        return self.chroma_client.get_or_create_collection(
            name=collection_name,
            metadata={"guideline_id": guideline_id}
        )

    def chunk_text(self, text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
        """Split text into overlapping chunks for better context retrieval"""
        words = text.split()
        chunks = []
        for i in range(0, len(words), chunk_size - overlap):
            chunk = " ".join(words[i:i + chunk_size])
            if chunk:
                chunks.append(chunk)
        return chunks

    def get_embedding(self, text: str, task_type: str = "RETRIEVAL_DOCUMENT") -> List[float]:
        """Generate embedding for text using google-genai SDK"""
        response = self.client.models.embed_content(
            model=self.embedding_model,
            contents=text,
            config=types.EmbedContentConfig(task_type=task_type)
        )
        return response.embeddings[0].values

    def index_guideline(self, guideline_id: str, guideline_text: str, metadata: Dict = None) -> int:
        """
        Ingest brand guideline into ChromaDB with embeddings.
        Stores chunks with metadata for citation retrieval.
        """
        collection = self.create_guideline_collection(guideline_id)
        chunks = self.chunk_text(guideline_text)

        if not chunks:
            return 0

        # Generate embeddings using Gemini
        embeddings = []
        for chunk in chunks:
            embedding = self.get_embedding(chunk, task_type="RETRIEVAL_DOCUMENT")
            embeddings.append(embedding)

        # Create unique IDs for each chunk
        ids = [
            hashlib.md5(f"{guideline_id}_{i}".encode()).hexdigest()
            for i in range(len(chunks))
        ]

        # Store in ChromaDB
        metadatas = [
            {
                "guideline_id": guideline_id,
                "chunk_index": i,
                "original_metadata": str(metadata) if metadata else ""
            }
            for i in range(len(chunks))
        ]

        collection.add(
            embeddings=embeddings,
            documents=chunks,
            metadatas=metadatas,
            ids=ids
        )

        return len(chunks)

    def retrieve_relevant_rules(
        self,
        guideline_id: str,
        content: str,
        top_k: int = 5
    ) -> List[Dict[str, any]]:
        """
        Retrieve top-k most relevant guideline chunks for given content.
        Returns chunks with citations and similarity scores.
        """
        collection = self.create_guideline_collection(guideline_id)
        count = collection.count()
        if count == 0:
            # Fall back to any collection with documents
            for col in self.chroma_client.list_collections():
                if col.count() > 0:
                    collection = col
                    count = col.count()
                    break

        if count == 0:
            return []

        # Generate query embedding
        query_embedding = self.get_embedding(content, task_type="RETRIEVAL_QUERY")

        # Query ChromaDB
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=min(top_k, count),
            include=["documents", "metadatas", "distances"]
        )

        # Format results with citations
        relevant_rules = []
        if results['documents'] and results['documents'][0]:
            for i, doc in enumerate(results['documents'][0]):
                metadata = results['metadatas'][0][i]
                distance = results['distances'][0][i]
                # Convert L2 distance to a rough similarity score
                similarity = max(0.0, 1.0 - distance / 2.0)

                relevant_rules.append({
                    "rule_text": doc,
                    "citation": f"Guideline Section {metadata.get('chunk_index', i) + 1}",
                    "similarity_score": round(similarity, 3),
                    "chunk_index": metadata.get("chunk_index", i)
                })

        return relevant_rules

    def generate_content(self, prompt: str) -> str:
        """Generate text using available Gemini flash models with fallback"""
        last_error = None
        for model_name in self.gen_models:
            try:
                response = self.client.models.generate_content(
                    model=model_name,
                    contents=prompt
                )
                if response.text:
                    return response.text
            except Exception as e:
                last_error = e
                continue
        if last_error:
            print(f"All generation models failed. Last error: {last_error}")
        return ""

    def semantic_audit(
        self,
        guideline_id: str,
        content: str,
        threshold: float = 0.7
    ) -> List[Dict[str, any]]:
        """
        Perform semantic audit by checking content against brand guidelines.
        Returns violations with exact rule citations.
        """
        relevant_rules = self.retrieve_relevant_rules(guideline_id, content, top_k=10)

        if not relevant_rules:
            return []

        # Build context from retrieved rules
        context = "\n\n".join([
            f"Rule {i+1} (from {rule['citation']}): {rule['rule_text']}"
            for i, rule in enumerate(relevant_rules)
        ])

        prompt = f"""You are a strict but fair brand compliance auditor. Analyze the content against the brand guidelines below.

BRAND GUIDELINES:
{context}

CONTENT TO AUDIT:
{content}

INSTRUCTIONS:
- Only flag CLEAR, DEFINITIVE violations where the content explicitly breaks a guideline rule.
- Do NOT flag content that already satisfies a requirement. If a disclaimer is present, do not flag it as missing.
- Do NOT flag content for things the guidelines don't explicitly require.
- Do NOT flag vague or speculative issues.
- If the content is compliant with the retrieved guidelines, return an empty array.

For each DEFINITIVE violation found, provide:
1. violation_type: Brief category (e.g., "Tone Mismatch", "Prohibited Term", "Missing Disclaimer")
2. description: Exact description of what is wrong and what guideline text it violates
3. rule_citation: Which guideline rule was violated (use the Rule number provided above)
4. severity: "high" for explicit rule breaks, "medium" for missing required elements, "low" for style issues
5. suggestion: Specific fix aligned with the exact guideline wording

Return ONLY valid JSON array format:
[
  {{
    "violation_type": "...",
    "description": "...",
    "rule_citation": "...",
    "severity": "...",
    "suggestion": "..."
  }}
]

If the content is compliant or no clear violations exist, return: []
"""

        try:
            response_text = self.generate_content(prompt).strip()

            # Strip markdown code fences if present
            if response_text.startswith('```json'):
                response_text = response_text.split('```json')[1].split('```')[0].strip()
            elif response_text.startswith('```'):
                response_text = response_text.split('```')[1].split('```')[0].strip()

            violations = json.loads(response_text)

            # Enrich violations with citation details
            for violation in violations:
                for rule in relevant_rules:
                    if rule['citation'] in violation.get('rule_citation', ''):
                        violation['rule_text'] = rule['rule_text']
                        violation['confidence_score'] = rule['similarity_score']
                        break

            return violations
        except (json.JSONDecodeError, Exception) as e:
            print(f"Error parsing Gemini response: {e}")
            return []

    def delete_guideline(self, guideline_id: str) -> bool:
        """Delete a guideline collection from ChromaDB"""
        collection_name = f"guideline_{guideline_id}"
        try:
            self.chroma_client.delete_collection(name=collection_name)
            return True
        except Exception:
            return False

    def check_content(self, content: str, guideline_id: str = "default") -> List[Dict[str, any]]:
        """
        Check content against guidelines and return formatted flags.
        Wrapper around semantic_audit for API compatibility.
        """
        violations = self.semantic_audit(guideline_id, content)

        flags = []
        for v in violations:
            flags.append({
                "issue_type": v.get("violation_type", "Compliance Issue"),
                "severity": self._map_severity(v.get("severity", "medium")),
                "flagged_text": v.get("description", "")[:100],
                "rule_citation": v.get("rule_citation", "Brand Guideline"),
                "explanation": v.get("description", ""),
                "suggested_fix": v.get("suggestion", "Review and align with brand guidelines"),
                "confidence": self._map_confidence(v.get("confidence_score", 0.7))
            })

        return flags

    def _map_severity(self, severity: str) -> str:
        """Map severity string to AuditFlag expected format"""
        return {"high": "critical", "medium": "warning", "low": "suggestion"}.get(severity, "warning")

    def _map_confidence(self, score: float) -> str:
        """Map numeric confidence score to label"""
        if score >= 0.8:
            return "high"
        elif score >= 0.6:
            return "medium"
        return "low"
