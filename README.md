<div align="center">

# ⚖️ LegalBuddy — AI-Driven Legal Document Intelligence

**AI-driven legal document summarization and compliance intelligence, specialized for Information Technology (IT) Corporate Law.**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python)](https://www.python.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Motor-47A248?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![Ollama](https://img.shields.io/badge/Ollama-Local%20LLM-black?style=flat-square)](https://ollama.ai/)
[![FAISS](https://img.shields.io/badge/FAISS-Vector%20Search-blue?style=flat-square)](https://faiss.ai/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)

</div>

---

## 📋 Table of Contents

1. [What is LegalBuddy?](#-what-is-legalbuddy)
2. [Key Features](#-key-features)
3. [How it Works — End-to-End Flow](#-how-it-works--end-to-end-flow)
4. [Architecture Overview](#-architecture-overview)
5. [Backend Microservices](#-backend-structure--true-microservices)
6. [Frontend Structure](#-frontend-structure--feature-sliced-design)
7. [API Reference](#-api-reference)
8. [Environment Variables](#-environment-variables)
9. [Installation & Running](#-installation--running)
10. [User Roles & Permissions](#-user-roles)
11. [Tech Stack Summary](#-tech-stack-summary)
12. [Security Features](#-security-features)
13. [Contributors](#-contributors)
14. [Troubleshooting](#-troubleshooting)

---

## 🎯 What is LegalBuddy?

**LegalBuddy** is a full-stack, enterprise-grade AI platform designed specifically for corporate legal counsels, compliance teams, and IT executives. It processes complex IT agreements (SaaS SLAs, NDAs, Master Services Agreements, Cloud Vendor Contracts, Employment Bonds) and provides instant legal intelligence:

- 📝 **Executive Summary** — Plain-English breakdown tailored for corporate stakeholders.
- 🎯 **Risk Score & Severity Gauge** — Quantified 0–100 risk score with critical flags for high-liability clauses.
- ⚠️ **Critical Risks & Liabilities** — Explicit identification of indemnification caps, lock-ins, and breach obligations.
- 📚 **Key Clauses & Provisions** — Extracted core terms, intellectual property clauses, and termination rights.
- ✅ **Party Obligations** — Categorized duties and recurring commitments.
- 🏛️ **Compliance Assessment** — Benchmarked against the **Indian Information Technology Act 2000**, **DPDP Act 2023**, and the **Indian Companies Act 2013**.

The RAG pipeline operates with **100% local inference** via Ollama — sensitive legal drafts never leave your secure perimeter.

---

## ✨ Key Features

| Feature | Details |
|---|---|
| 🔐 **Dual Authentication** | Secure Email/Password with bcrypt + **Google Sign-In (OAuth 2.0)** + JWT session tokens. |
| 👤 **Role-Based Access** | `admin` (Platform Administrator) and `user` (Corporate Legal Professional). |
| 🧭 **Interactive Guided Tour** | Contextual step-by-step onboarding walkthrough for newly registered users. |
| 🎨 **Refined Brand Identity** | Dedicated transparent SVG emblem & branding, complete with Dark/Light theme toggle. |
| 📁 **Document Processing** | Support for PDF and Word (`.pdf`, `.docx`, `.doc`) documents up to 5 MB. |
| 🤖 **Specialized IT RAG Pipeline** | Pre-indexed FAISS vector knowledge base containing Indian IT and corporate laws with SentenceTransformers (`all-MiniLM-L6-v2`). |
| 🧠 **Local LLM Engine** | Ollama-hosted models (`qwen3:1.7b`, `llama3`, `mistral`) with zero external API data exposure. |
| 📊 **Risk Scoring & Metrics** | Real-time calculation of risk score, severity distribution, and critical warnings. |
| ⏳ **Asynchronous Processing** | Non-blocking execution with FastAPI `BackgroundTasks` and live status polling. |
| ❌ **Cancel & Retry** | Cancel in-flight analyses anytime or retry failed document processing runs. |
| 🎛️ **Admin Console** | Comprehensive User Management table, user approval workflow, statistics, and daily limit resets. |
| 🛡️ **Production Hardening** | Clean separation of dev/prod URLs via `VITE_API_URL`, SPA routing fallbacks, rate limiting, and CORS headers. |

---

## 🔄 How it Works — End-to-End Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          DOCUMENT ANALYSIS FLOW                         │
└─────────────────────────────────────────────────────────────────────────┘

1. USER UPLOADS FILE (PDF / DOCX)
         │
         ▼
2. DOCUMENT SERVICE (:8002 via Gateway :5000)
   ├── Validates file extension (.pdf, .docx, .doc) & size (≤ 5 MB)
   ├── Verifies user concurrency & daily upload quotas (e.g. 5/day for users)
   ├── Persists document in isolated user storage (uploads/<user_id>/<filename>)
   └── Records document state in MongoDB (status: UPLOADED)
         │
         ▼
3. RAG SERVICE (:8003 via Gateway :5000) — triggers BackgroundTask
         │
         ▼
4. INGESTION WORKER (_async_process_document)
   │
   ├── EXTRACTING  — pdfplumber / python-docx extracts full document text
   │
   ├── CHUNKING    — Sliding window segmentation (500 words, 100 word overlap)
   │
   ├── EMBEDDING   — SentenceTransformers generates dense embeddings
   │
   ├── INDEXING    — Builds transient local FAISS index for document chunks
   │
   ├── ANALYZING   — Queries Global Law Knowledge Base (Indian IT & Corporate Law)
   │                 → Retrieves top-K statutory references
   │                 → Synthesizes prompt with specialized corporate legal rules
   │                 → Local Ollama LLM infers Summary, Risk Score, Clauses & Compliance
   │
   └── COMPLETED   — Analysis saved to MongoDB, document status marked COMPLETED
         │
         ▼
5. FRONTEND POLLS /result/{doc_id} every 3 seconds
         │
         ▼
6. DISPLAY: Risk Score | Critical Warnings | Summary | Clauses | Obligations | Compliance
```

---

## 🏗️ Architecture Overview

LegalBuddy operates on a **True Microservices Architecture**. Each service runs as an isolated FastAPI application on dedicated ports, fronted by an API Gateway:

```
┌──────────────────────────────────────────────────────────────────────┐
│              FRONTEND (Vite + React 19)                              │
│              Configured via VITE_API_URL → API Gateway (:5000)       │
└───────────────────────────┬──────────────────────────────────────────┘
                            │ HTTP
                            ▼
┌──────────────────────────────────────────────────────────────────────┐
│               API GATEWAY  :5000  (FastAPI + httpx proxy)            │
│  CORS Handling · Security Headers · Route Forwarding · Health Check  │
│                                                                      │
│  /api/auth/*         → auth_service:8001                             │
│  /api/documents/*    → document_service:8002                         │
│  /summarize/*        → rag_service:8003                              │
│  /result/*           → rag_service:8003                              │
└────┬────────────────────────┬──────────────────────┬─────────────────┘
     │ HTTP                   │ HTTP                  │ HTTP
     ▼                        ▼                       ▼
┌─────────────┐     ┌──────────────────┐    ┌──────────────────────────┐
│ AUTH SERVICE│     │ DOCUMENT SERVICE │    │      RAG SERVICE         │
│   :8001     │     │      :8002       │    │         :8003             │
│             │     │                  │    │                          │
│ User Signup │     │ Upload (.pdf/doc)│    │ /summarize/{id} trigger  │
│ Local Login │     │ List / Delete    │    │ /result/{id} polling     │
│ Google Auth │     │ Serve File       │    │ /cancel & retry          │
│ Admin Users │     │ Limit Enforcement│    │ IT Law FAISS Pipeline    │
└──────┬──────┘     └────────┬─────────┘    └──────────┬───────────────┘
       │                     │                          │
       └─────────────────────┴──────────────────────────┘
                                     │
              ┌──────────────────────▼──────────────────────┐
              │              SHARED LIBRARY                  │
              │  (shared config, MongoDB repos, providers)  │
              └─────────────────────────────────────────────┘
                                     │
              ┌──────────────────────▼──────────────────────┐
              │         SHARED MONGODB (Motor async)         │
              │    users · documents · summaries · tickets   │
              └─────────────────────────────────────────────┘
```

---

## 📁 Backend Structure — True Microservices

```
backend/
├── shared/                              # Shared library imported across services
│   ├── config/
│   │   └── settings.py                  # Environment-driven configuration
│   ├── database/
│   │   ├── mongo.py                     # Motor async client & database connection
│   │   ├── user_repo.py                 # User & Admin database operations
│   │   └── document_repo.py             # Document storage and status lifecycle
│   ├── providers/
│   │   ├── llm.py                       # Ollama LLM provider interface
│   │   ├── embedding.py                 # SentenceTransformer embeddings
│   │   └── vector_store.py              # FAISS vector store managers
│   ├── security/
│   │   └── jwt.py                       # JWT token creation and validation
│   └── storage/
│       └── provider.py                  # Local disk storage abstractions
│
├── services/
│   ├── api_gateway/                     ← PORT 5000 (Primary Entrypoint)
│   │   ├── main.py                      # Gateway reverse proxy + CORS management
│   │   └── Dockerfile
│   │
│   ├── auth_service/                    ← PORT 8001
│   │   ├── main.py                      # Auth FastAPI application
│   │   ├── router.py                    # Auth, Google OAuth & User Admin endpoints
│   │   ├── service.py                   # Business logic for auth, registration & users
│   │   └── notification/service.py      # Notification dispatcher
│   │
│   ├── document_service/                ← PORT 8002
│   │   ├── main.py                      # Document management FastAPI app
│   │   ├── router.py                    # Upload, stream, delete & reset endpoints
│   │   └── service.py                   # Storage, validation & file streaming
│   │
│   └── rag_service/                     ← PORT 8003
│       ├── main.py                      # RAG pipeline FastAPI app
│       ├── router.py                    # /summarize, /result & /cancel endpoints
│       ├── service.py                   # Ingestion orchestrator & LLM prompt caller
│       ├── extraction.py                # Extract text from PDF and Word documents
│       ├── analysis/prompts.py          # Structured prompt engineering & JSON schema parser
│       └── ingestion_worker/tasks.py    # Background task executor
│
├── scripts/
│   ├── build_index.py                   # Generates global FAISS index from IT corporate law
│   └── __init__.py
│
├── run_dev.py                           # Cross-platform development service runner
├── requirements.txt                     # Backend Python dependencies
└── .env.example                         # Reference environment variables
```

---

## 🖥️ Frontend Structure — Feature-Sliced Design

```
frontend/
├── src/
│   ├── core/                            # Application framework & layouts
│   │   ├── App.jsx                      # Root gate (Auth checks & routing)
│   │   ├── LayoutView.jsx               # App wrapper with responsive sidebars & topbars
│   │   └── SidebarView.jsx              # Navigation, user quota meter & theme toggle
│   │
│   ├── features/
│   │   ├── auth/                        # Authentication & onboarding
│   │   │   ├── views/
│   │   │   │   ├── UserLoginView.jsx    # User login & signup with Google OAuth
│   │   │   │   ├── AdminLoginView.jsx   # Dedicated administrator portal
│   │   │   │   └── LoginView.jsx        # Unified dispatcher
│   │   │   └── models/authStore.js      # Session & credentials state
│   │   │
│   │   ├── onboarding/
│   │   │   └── QuickTourModal.jsx       # Guided interactive onboarding tour
│   │   │
│   │   ├── profile/
│   │   │   └── views/
│   │   │       ├── ProfilePageView.jsx  # User account & organization profile
│   │   │       └── UserProfileModal.jsx # Quick profile edit modal
│   │   │
│   │   ├── documents/                   # Document analysis suite
│   │   │   ├── views/
│   │   │   │   ├── DocumentsView.jsx    # Risk Score, clauses & compliance display
│   │   │   │   └── UploadAreaView.jsx   # Drag & drop file upload with size checks
│   │   │   └── models/fileStore.js      # Document state & real-time polling
│   │   │
│   │   ├── dashboard/
│   │   │   └── views/DashboardView.jsx  # Main hub, quick statistics & recent uploads
│   │   │
│   │   └── admin/                       # Platform administration
│   │       └── views/
│   │           ├── AdminPanelView.jsx   # Admin overview dashboard
│   │           ├── AdminUsersView.jsx   # User management table & approvals
│   │           └── AdminUserDetailView.jsx # Individual user audit & quota reset
│   │
│   ├── shared/
│   │   ├── ui/
│   │   │   └── LegalBuddyLogo.jsx       # Custom brand SVG emblem & typography
│   │   ├── utils/
│   │   │   └── api.js                   # Unified API client (supports VITE_API_URL)
│   │   └── store/uiStore.js             # Theme (Dark/Light) & page state
│   │
│   ├── assets/legalbuddy-logo.svg       # Brand vector asset
│   └── index.css                        # TailwindCSS design tokens & themes
│
├── vercel.json                          # Production deployment & SPA rewrites configuration
├── vite.config.js                       # Vite bundler build settings
└── .env.example                         # Frontend environment variables template
```

---

## 🌐 API Reference

### Authentication & Users — `/api/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/signup` | Public | Register new user with IT role & specialization |
| `POST` | `/api/auth/login` | Public | Sign in with email, password & reCAPTCHA |
| `POST` | `/api/auth/google` | Public | Authenticate or register using Google OAuth |
| `GET` | `/api/auth/me` | Bearer Token | Retrieve current logged-in user profile |
| `GET` | `/api/auth/admin/users/all` | Admin Token | List all registered users |
| `GET` | `/api/auth/admin/users/pending` | Admin Token | List pending user accounts |
| `POST` | `/api/auth/admin/users/approve/{id}` | Admin Token | Approve user account |
| `POST` | `/api/auth/admin/users/reset-limit/{id}` | Admin Token | Reset user's daily upload count to 0 |
| `GET` | `/api/auth/admin/stats` | Admin Token | Platform-wide analytics and usage metrics |

### Documents — `/api/documents`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/documents/upload` | Bearer Token | Upload PDF/Word document (≤ 5 MB) |
| `GET` | `/api/documents` | Bearer Token | List all uploaded documents for user |
| `GET` | `/api/documents/{id}` | Bearer Token | Get document metadata & analysis state |
| `DELETE` | `/api/documents/{id}` | Bearer Token | Delete document and associated disk files |
| `GET` | `/api/documents/{id}/file` | Bearer Token | Stream file content for preview |
| `POST` | `/api/documents/{id}/cancel` | Bearer Token | Cancel currently running analysis |
| `POST` | `/api/documents/reset-stuck` | Bearer Token | Clear stuck processing states |

### RAG Analysis Service

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/summarize/{id}` | Bearer Token | Start IT Corporate Law RAG analysis pipeline |
| `GET` | `/result/{id}` | Bearer Token | Poll real-time progress and structured output |

---

## ⚙️ Environment Variables

### Backend Configuration (`backend/.env`)

```env
# ── Server ──────────────────────────────────────────────────────
HOST=0.0.0.0
PORT=5000
DEBUG=false

# ── MongoDB ─────────────────────────────────────────────────────
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB=legalbuddy

# ── JWT Security ────────────────────────────────────────────────
JWT_SECRET=your-secure-random-secret-key
JWT_EXPIRE_HOURS=24

# ── Ollama Local LLM ─────────────────────────────────────────────
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen3:1.7b
OLLAMA_TIMEOUT=120

# ── File Limits & RAG ────────────────────────────────────────────
MAX_FILE_SIZE_MB=5
CHUNK_SIZE_WORDS=500
CHUNK_OVERLAP_WORDS=100
FAISS_INDEX_PATH=output/faiss_index.bin
FAISS_METADATA_PATH=output/metadata.pkl

# ── CORS Origins ─────────────────────────────────────────────────
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Frontend Configuration (`frontend/.env`)

```env
# ── Backend API URL ──────────────────────────────────────────────
# In local development points to API Gateway:
VITE_API_URL=http://localhost:5000

# ── Google OAuth 2.0 ──────────────────────────────────────────────
# Google Cloud Console OAuth Client ID
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# ── Google reCAPTCHA v2 ──────────────────────────────────────────
# Public Site Key
VITE_RECAPTCHA_SITE_KEY=your-recaptcha-site-key
```

---

## 🚀 Installation & Running

### Prerequisites

- **Python**: 3.11+
- **Node.js**: 18+
- **MongoDB**: 6.0+ (Local or Atlas)
- **Ollama**: Installed with model pulled (`ollama pull qwen3:1.7b`)

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start all microservices together
python run_dev.py
```

API Gateway will start at `http://localhost:5000`. Test health status at `http://localhost:5000/health`.

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit the application at `http://localhost:5173`.

### 3. Build FAISS Knowledge Base (One-time step)

```bash
# From backend directory with venv activated
python -m scripts.build_index --pdf ../act.pdf
```

This processes the statutory document and creates `output/faiss_index.bin` and `output/metadata.pkl`.

---

## 👥 User Roles

### User (Corporate Legal Counsel / IT Executive)
- Registers via Signup form or One-Click Google Sign-In.
- Welcomed with an interactive Quick Tour explaining features and workflow.
- Uploads and analyzes agreements (.pdf, .docx, .doc up to 5 MB).
- Inspects Risk Score gauges, Critical Liability flags, Clause breakdowns, and DPDP/IT Act compliance.
- Daily usage limit tracking in the navigation sidebar.

### Admin (Platform Administrator)
- Dedicated Admin Login portal with credentials management.
- Approves or rejects new user access requests.
- Reviews user activity, company affiliations, and role designations.
- Resets daily document upload quotas for specific accounts.
- Inspects system-wide document and user statistics.

---

## 🛠️ Tech Stack Summary

### Backend
- **FastAPI 0.115** — High-performance async microservices and API Gateway.
- **MongoDB & Motor** — Asynchronous NoSQL document store.
- **Ollama** — Local, privacy-first inference engine.
- **SentenceTransformers & FAISS** — Vector embeddings and similarity search.
- **pdfplumber & python-docx** — Reliable text extraction.
- **SlowAPI** — Rate limiting and traffic throttling.

### Frontend
- **React 19 & Vite 6** — Modern component framework and build toolchain.
- **TailwindCSS 4** — Design system and responsive dark/light styling.
- **Zustand** — Lightweight modular global state management.
- **@react-oauth/google** — Google Identity OAuth 2.0 integration.
- **Framer Motion & Lucide Icons** — Micro-interactions and interface icons.

---

## 🔒 Security Features

- **Local-Only LLM Processing**: No proprietary legal clauses leave the host machine.
- **bcrypt Password Hashing**: Zero plain-text credentials stored.
- **JWT Authentication**: Configurable token expiration and bearer headers.
- **Google reCAPTCHA v2**: Anti-bot challenge on login and signup flows.
- **File Validation**: Strict MIME-type checking and 5 MB size ceilings.
- **Scoped User Ownership**: All document operations strictly require matching user IDs.

---

## 👥 Contributors

This project was built collaboratively by:

| Name | GitHub |
|---|---|
| **Kritik Kaushik** | [github.com/KritikKaushik](https://github.com/KritikKaushik) |
| **Ahana Gupta** | [github.com/AhanaGupta004](https://github.com/AhanaGupta004) |
| **Pankaj Singh Bisht** | [github.com/PankajSinghBisht018](https://github.com/PankajSinghBisht018) |
| **Harpreet Singh** | [github.com/harpreetsingh21-cloud](https://github.com/harpreetsingh21-cloud) |
| **Kamakshi Arora** | [github.com/kamakshi-13](https://github.com/kamakshi-13) |
| **Lakshya Kansal** | [github.com/Lakshya1126](https://github.com/Lakshya1126) |

---

## 🩺 Troubleshooting

| Issue | Likely Cause | Solution |
|---|---|---|
| `Connection refused on port 11434` | Ollama service is not running | Run `ollama serve` in a terminal or launch Ollama app. |
| `CORS Error on API Call` | Origin mismatch or port issue | Ensure `CORS_ORIGINS` in `backend/.env` contains your frontend URL. |
| `422 Unprocessable Entity on Signup` | Missing required fields or payload mismatch | Complete all fields including IT designation and organization. |
| `FAISS index missing error` | Law knowledge base has not been indexed | Run `python -m scripts.build_index` to build `output/faiss_index.bin`. |
| `Upload rejected` | File size exceeds 5 MB or invalid extension | Verify file is a valid `.pdf`, `.docx`, or `.doc` under 5 MB. |

<div align="center">

Built with ❤️ by **Kritik Kaushik**, **Pankaj Singh Bisht**, **Harpreet Singh**, **Ahana Gupta**, **Kamakshi Arora**, **Lakshya Kansal** and Team.

</div>
