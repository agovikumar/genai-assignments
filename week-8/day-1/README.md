# RAG Mongo Demo

A full-stack demo application for building and exercising a Retrieval-Augmented Generation (RAG) pipeline over QA test cases and user stories, using **MongoDB Atlas Vector Search** for retrieval, **Mistral AI or Cohere** (selectable) for embeddings, and **Groq** for LLM-based reranking/summarization.

The app provides an end-to-end workflow through a React UI: convert Excel data to JSON, generate embeddings and store them in MongoDB, preprocess search queries, and run vector / keyword (BM25) / hybrid / reranked search over the stored test cases and user stories.

## Architecture

```
client/   React (MUI) single-page app — one tab per pipeline stage
server/   Express API (server/index.js) — orchestrates uploads, embeddings, and search
src/      Core pipeline logic, reusable outside the server (Node scripts)
  ├─ config/    MongoDB Atlas Search index definitions (vector + BM25)
  ├─ data/      Sample/working Excel & JSON data files
  └─ scripts/
      ├─ data-conversion/    Excel → JSON converters, Jira story fetcher
      ├─ embeddings/         Batch embedding generation (Mistral or Cohere) + MongoDB insertion
      ├─ query-preprocessing/ Query normalization, abbreviation & synonym expansion
      ├─ search/             Vector, BM25, hybrid, score-fusion & rerank search
      └─ utilities/          Mistral & Cohere embedding clients, embedding provider factory, Groq client, doc cleanup
uploads/  Uploaded Excel files (runtime, git-ignored)
```

Data flows through the pipeline as:

1. **Convert** — Excel workbooks (test cases or user stories) are uploaded and converted to JSON.
2. **Embed & Store** — JSON records are embedded in batches, using either Mistral (`mistral-embed`) or Cohere (`embed-english-v3.0`), and upserted into MongoDB Atlas collections. The provider is chosen per embedding job in the UI; query-time embedding (search) uses whichever provider is set via `EMBEDDING_PROVIDER` so it matches the collection's embeddings.
3. **Preprocess** — Raw user queries are normalized, abbreviation/synonym-expanded before search.
4. **Search** — Query the stored documents via:
   - Vector similarity search (MongoDB Atlas `$vectorSearch`)
   - BM25 keyword search (MongoDB Atlas Search, field-weighted)
   - Hybrid search (BM25 + vector combined)
   - Score-fusion / LLM reranking (Groq)
5. **Summarize & Dedup** — Deduplicate and summarize result sets using Groq LLMs.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, MUI 7, React Router, Notistack |
| Backend | Node.js (ESM), Express, Multer (file uploads) |
| Database | MongoDB Atlas (Vector Search + Atlas Search/BM25) |
| Embeddings | Mistral AI (`mistral-embed`) or Cohere (`embed-english-v3.0`), selectable per job |
| Reranking / Summarization | Groq (`groq-sdk`) |
| Other integrations | Jira story fetching, MySQL/Sequelize support |

## Prerequisites

- Node.js 18+
- A MongoDB Atlas cluster with Vector Search and Atlas Search enabled
- API keys for Groq, and for at least one embedding provider (Mistral AI and/or Cohere)

## Setup

1. **Install dependencies** (installs both root and `client` packages via `postinstall`):
   ```bash
   npm install
   ```

2. **Configure environment variables** — copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```

   | Variable | Description |
   |---|---|
   | `MONGODB_URI` | MongoDB Atlas connection string |
   | `DB_NAME` | Database name |
   | `COLLECTION_NAME` | Test cases collection |
   | `VECTOR_INDEX_NAME` | Atlas Vector Search index name for test cases |
   | `BM25_INDEX_NAME` | Atlas Search (BM25) index name for test cases |
   | `USER_STORIES_COLLECTION_NAME` | User stories collection |
   | `USER_STORIES_VECTOR_INDEX_NAME` | Atlas Vector Search index name for user stories |
   | `EMBEDDING_PROVIDER` | Provider used to embed **search queries** at query time: `mistral` or `cohere` (default: `mistral`). Should match the provider used when the target collection's embeddings were created |
   | `MISTRAL_API_KEY` | Mistral AI API key (embeddings) |
   | `MISTRAL_EMBEDDING_MODEL` | Mistral embedding model (default: `mistral-embed`) |
   | `COHERE_API_KEY` | Cohere API key (embeddings) |
   | `COHERE_EMBEDDING_MODEL` | Cohere embedding model (default: `embed-english-v3.0`) |
   | `GROQ_API_KEY` | Groq API key (reranking/summarization) |
   | `GROQ_RERANK_MODEL` | Groq model used for reranking |
   | `GROQ_SUMMARIZATION_MODEL` | Groq model used for summarization |

3. **Create Atlas Search indexes** on your collections using the index definitions in `src/config/` (`testcases-vector-index.json`, `testcases-bm25-index.json`, `user-stories-vector-index.json`, `user-stories-bm25-index.json`) via the Atlas UI or Atlas CLI.

## Running the App

Run both the API server and the React client concurrently:

```bash
npm run dev
```

- Backend: `http://localhost:3001` (configurable via `PORT`)
- Frontend: `http://localhost:3000` (React dev server)

Individual commands:
```bash
npm run server   # start Express API only
npm run client   # start React dev server only
npm run build    # production build of the client
```

## Frontend Modules

The React app (`client/src`) exposes each pipeline stage as a sidebar tab:

- **Convert to JSON** — upload Excel files (test cases or user stories) and convert to JSON
- **Embeddings & Store** — generate embeddings and store documents in MongoDB, with a toggle to choose the embedding provider (Mistral AI or Cohere) per job
- **Query Preprocessing** — inspect normalization/abbreviation/synonym expansion of a query
- **Vector Search** — semantic search via embeddings
- **BM25 Search** — keyword search with field-level weighting
- **Hybrid Search** — combined BM25 + vector retrieval
- **Score Fusion** — fused/reranked results
- **Summarize & Dedup** — AI-based deduplication and summarization of results
- **Prompt & Schema** — configure prompt templates and JSON schemas used by the LLM steps
- **Settings** — view/update environment configuration

## Key API Endpoints (server/index.js)

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/files` | List uploaded files |
| POST | `/api/upload-excel` | Upload & convert an Excel file |
| POST | `/api/create-embeddings` | Generate embeddings for a dataset |
| POST | `/api/create-embeddings-batch` | Batch embedding + MongoDB insert with job tracking (`provider`: `mistral` or `cohere`) |
| GET | `/api/jobs/:jobId` / `/api/jobs/active` | Track background job progress |
| GET | `/api/metadata/distinct` | Distinct field values for filtering |
| POST | `/api/search` | Vector search |
| POST | `/api/search/bm25` | BM25 keyword search |
| POST | `/api/search/hybrid` | Hybrid (BM25 + vector) search |
| POST | `/api/search/rerank` | Score-fusion / LLM rerank search |
| POST | `/api/search/user-stories` | Search over user stories |
| POST | `/api/search/preprocess` | Query preprocessing (normalize/expand) |
| POST | `/api/search/deduplicate` / `/api/search/summarize` | Dedup & summarize results |
| POST | `/api/test-prompt` | Test a prompt/schema against an LLM |
| GET/POST | `/api/env` | Read/update environment configuration |

## Standalone Scripts

The scripts under `src/scripts` can also be run directly with Node for offline/batch processing outside the web UI, e.g.:

```bash
node src/scripts/data-conversion/excel-to-json.js
node src/scripts/embeddings/create-embeddings-batch-mistral.js
node src/scripts/embeddings/create-embeddings-batch-cohere.js
node src/scripts/embeddings/create-userstories-embeddings-batch-cohere.js
node src/scripts/search/bm25-search.js
node src/scripts/search/score-fusion-search.js
```

Query-time embeddings (used by the search scripts/endpoints) go through `src/scripts/utilities/embeddingProvider.js`, a factory that picks the Mistral or Cohere client based on `EMBEDDING_PROVIDER`.

## Notes

- `uploads/` stores files uploaded through the UI at runtime and is not meant to be committed.
- `releases/` contains sample user story text files used for testing story ingestion/search.
- Sample data (Excel/JSON) lives under `src/data/` for local experimentation.
