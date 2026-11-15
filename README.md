<div align="center">

# ⚖️ LegalBuddy — AI-Driven Legal Document Intelligence

**AI-driven legal document summarization and compliance intelligence, specialized for Information Technology (IT) Corporate Law.**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python)](https://www.python.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Motor-47A248?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![PhonePe](https://img.shields.io/badge/PhonePe-Payment%20Gateway%20v2-5f259f?style=flat-square)](https://www.phonepe.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker)](https://www.docker.com/)
[![Ollama](https://img.shields.io/badge/Ollama-Local%20LLM-black?style=flat-square)](https://ollama.ai/)
[![FAISS](https://img.shields.io/badge/FAISS-Vector%20Search-blue?style=flat-square)](https://faiss.ai/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)

</div>

---

## 📋 Table of Contents

1. [What is LegalBuddy?](#-what-is-legalbuddy)
2. [Key Features](#-key-features)
3. [Subscription Plans & Pricing](#-subscription-plans--pricing)
4. [How it Works — End-to-End Flow](#-how-it-works--end-to-end-flow)
5. [Architecture Overview](#-architecture-overview)
6. [Backend Structure — True Microservices](#-backend-structure--true-microservices)
7. [Frontend Structure — Feature-Sliced Design](#-frontend-structure--feature-sliced-design)
8. [API Reference](#-api-reference)
9. [Environment Variables](#-environment-variables)
10. [Installation & Running](#-installation--running)
    - [Option 1: Quick 1-Click Launch (Windows)](#1-quick-1-click-launcher-windows)
    - [Option 2: Docker Compose (Cross-Platform / macOS / Linux)](#2-docker-compose-containerized--cross-platform)
    - [Option 3: Manual Step-by-Step](#3-manual-step-by-step-execution)
11. [User Roles & Permissions](#-user-roles--tiers)
12. [Tech Stack Summary](#-tech-stack-summary)
13. [Security & Compliance](#-security-features)
14. [Contributors](#-contributors)
15. [Troubleshooting](#-troubleshooting)

---

## 🎯 What is LegalBuddy?

**LegalBuddy** is a full-stack, enterprise-grade AI platform designed specifically for corporate legal counsels, compliance teams, tech founders, and IT professionals. It processes complex IT agreements (SaaS SLAs, NDAs, Master Services Agreements, Cloud Vendor Contracts, Employment Bonds, Offer Letters) and delivers actionable legal diligence:

- 📝 **Executive Summary** — Plain-English breakdown tailored for corporate stakeholders.
- 🎯 **Legal Risk Score & Severity Gauge** — Quantified 0–100 risk score with critical flags for high-liability clauses.
- ⚠️ **Critical Risks & Liabilities** — Explicit identification of indemnification caps, lock-ins, non-competes, and breach penalties.
- 📚 **Key Clauses & Provisions** — Extracted core terms, intellectual property assignment, and termination rights.
- ✅ **Party Obligations** — Categorized duties and recurring commitments.
- 🏛️ **Statutory Compliance Assessment** — Cross-referenced against the **Indian Contract Act 1872 (Section 27 on Restraint of Trade)**, **Information Technology Act 2000**, **Digital Personal Data Protection (DPDP) Act 2023**, and the **Indian Companies Act 2013**.

The RAG pipeline operates with **local & cloud LLM inference** via Ollama — sensitive legal drafts never leave your secure perimeter.

---

## ✨ Key Features

| Feature | Details |
|---|---|
| 🟣 **PhonePe Payment Gateway (v2 Checkout)** | Fully integrated PhonePe PG with native **Official Dynamic UPI QR Code**, in-page full-size checkout modal, and automated background real-time status verification. Supports all major UPI apps (PhonePe, Google Pay, Paytm, BHIM, CRED) and cards with automated Pro activation. |
| 📦 **Tiered Subscription Plans** | **Basic (Free)** with 5 daily document uploads and **Pro Subscription (₹199 / month)** with unlimited document analyses and priority AI processing. |
| 🔐 **Dual Authentication** | Secure Email/Password with bcrypt + **Google Sign-In (OAuth 2.0)** + JWT session tokens + Master OTP bypass (`999888`) for rapid testing. |
| 👤 **Granular Role & Tier Hierarchy** | Clean distinction between Platform **Administrators**, **Pro Subscribers** (Paid), and **Standard Users** (Free). |
| 🧭 **Interactive Guided Tour** | Contextual step-by-step onboarding walkthrough for newly registered users. |
| 📁 **Multi-Format Processing** | Parse PDF and Word (`.pdf`, `.docx`, `.doc`) documents up to 50 MB with automatic text extraction. |
| 🤖 **Specialized IT RAG Pipeline** | Pre-indexed FAISS vector knowledge base containing Indian IT and corporate laws with SentenceTransformers (`all-MiniLM-L6-v2`). |
| 🧠 **Local LLM Engine** | Ollama-hosted models (`qwen3:1.7b`, `gemma`, `llama3`) with zero unauthorized external API data exposure. |
| 📊 **Risk Scoring & Metrics** | Real-time calculation of risk score, severity distribution, and critical warnings. |
| ⏳ **Self-Healing Asynchronous Processing** | Non-blocking execution with FastAPI `BackgroundTasks`, live status polling, and automatic recovery of pending analyses. |
| ❌ **Cancel & Retry** | Cancel in-flight analyses anytime or retry failed document processing runs. |
| 🎛️ **Admin Console** | Comprehensive User Management table with distinct Admin, Pro, and Standard badges, usage tracking, and limit reset actions. |
| 🐳 **Docker & macOS Ready** | Production-ready Docker Compose orchestration supporting Apple Silicon (M1/M2/M3/M4) Metal acceleration, Intel Macs, Windows, and Linux. |

---

## 💳 Subscription Plans & Pricing

LegalBuddy provides two straightforward tiers configured for individuals, legal consultants, and technology organizations:

```
┌───────────────────────────────────────┐       ┌───────────────────────────────────────┐
│              BASIC (FREE)             │       │      PRO SUBSCRIPTION (RECOMMENDED)   │
│               ₹0 / forever            │       │             ₹199 / month              │
├───────────────────────────────────────┤       ├───────────────────────────────────────┤
│ • 5 Document uploads per day          │       │ • UNLIMITED Document Uploads & Analyses│
│ • IT Offer Letter & Bond review       │       │ • ICA Sec 27 Non-Compete Enforceability│
│ • Standard Risk Scoring & Summary     │       │ • Deep IT Corporate Risk Assessment   │
│ • Standard Cloud / Local LLM Queue    │       │ • Priority High-Speed AI Queue        │
│ • Community Support                   │       │ • PDF & DOCX Export Reports           │
│                                       │       │ • Direct Specialist Support           │
└───────────────────────────────────────┘       └───────────────────────────────────────┘
```

### Payment & Verification Workflow:
1. User clicks **"Pay with PhonePe / UPI QR (₹199)"** on the Frontend.
2. Payment Service (`:8004`) initializes an order via **PhonePe Standard Checkout v2** (`/checkout/v2/pay`) using OAuth credentials (`client_id`, `client_secret`, `client_version`).
3. An in-page, full-size **PhonePe Official Checkout Modal** renders the live PhonePe checkout screen containing the **authentic, dynamic PhonePe UPI QR Code** along with a countdown timer and order details.
4. User scans the on-screen PhonePe QR Code using **PhonePe**, **Google Pay**, **Paytm**, or **BHIM**, or uses the "Fullscreen" button to open the checkout page in a browser tab.
5. **Zero Manual Action Required**:
   - The frontend modal runs an automated real-time background detector polling the backend every 2.5 seconds.
   - The moment PhonePe confirms the payment, the modal automatically transitions to a green **"Payment Successful!"** state, refreshes the user session, and closes.
6. Once verified:
   - Account upgraded: `subscription_tier: "pro"`, `is_unlimited: True`, `subscription_expiry: (now + 30 days)`.
   - Payment audit entry created in the `payments` MongoDB collection.
   - User immediately gets unmetered access with **PRO** badge.

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
   ├── Validates file extension (.pdf, .docx, .doc) & size (≤ 50 MB)
   ├── Checks Quota: Unlimited for Pro & Admin; 5 docs/day for Basic Free
   ├── Persists document in isolated user storage (uploads/<user_id>/<filename>)
   └── Records document state in MongoDB (status: UPLOADED)
         │
         ▼
3. RAG SERVICE (:8003 via Gateway :5000) — triggers BackgroundTask
         │
         ▼
4. INGESTION WORKER (_async_process_document)
   │
   ├── EXTRACTING  — pdfplumber / python-docx extracts full text
   │
   ├── CHUNKING    — Sliding window segmentation (500 words, 100 overlap)
   │
   ├── EMBEDDING   — SentenceTransformers generates dense vectors
   │
   ├── INDEXING    — Builds transient local FAISS index for document chunks
   │
   ├── ANALYZING   — Queries Global IT Law Knowledge Base (Sec 27 ICA, IT Act 2000)
   │                 → Retrieves top-K statutory references
   │                 → Builds prompt with strict corporate legal guidelines
   │                 → Ollama LLM infers Summary, Risk Score, Clauses & Compliance
   │
   └── COMPLETED   — Analysis saved to MongoDB, document status marked COMPLETED
         │
         ▼
5. FRONTEND POLLS /result/{doc_id} every 3 seconds (Self-healing auto-trigger)
         │
         ▼
6. DISPLAY: Risk Score | Critical Warnings | Summary | Clauses | Obligations | Compliance
```

---

## 🏗️ Architecture Overview

LegalBuddy operates on a **True Microservices Architecture**. Each service is an independent FastAPI application running on its own port, unified through a high-throughput API Gateway:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Vite + React 19 + TailwindCSS)                        │
│                        Runs on :5173  (Calls VITE_API_URL → :5000)                     │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ HTTP
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                         API GATEWAY :5000  (FastAPI Reverse Proxy)                     │
│               CORS Management · Security Headers · Request Tracing · Health            │
│                                                                                        │
│  /api/auth/*         → auth_service:8001                                               │
│  /api/documents/*    → document_service:8002                                           │
│  /summarize/*        → rag_service:8003                                                │
│  /result/*           → rag_service:8003                                                │
│  /api/payments/*     → payment_service:8004                                            │
└────┬────────────────────────┬─────────────────────────┬───────────────────────────┬────┘
     │ HTTP                   │ HTTP                    │ HTTP                      │ HTTP
     ▼                        ▼                         ▼                           ▼
┌─────────────┐     ┌──────────────────┐      ┌──────────────────┐        ┌──────────────────┐
│ AUTH SERVICE│     │ DOCUMENT SERVICE │      │   RAG SERVICE    │        │ PAYMENT SERVICE  │
│    :8001    │     │      :8002       │      │      :8003       │        │      :8004       │
│             │     │                  │      │                  │        │                  │
│ User Signup │     │ Upload (.pdf/doc)│      │ Ingestion Worker │        │ PhonePe Checkout │
│ JWT Sessions│     │ List / Stream    │      │ Chunking & Embed │        │ OAuth & Verify   │
│ Google OAuth│     │ Quota Checking   │      │ FAISS Law Search │        │ 30-Day Pro Sub   │
│ Admin Mgmt  │     │ Storage Provider │      │ Ollama LLM Agent │        │ Billing History  │
└──────┬──────┘     └────────┬─────────┘      └────────┬─────────┘        └────────┬─────────┘
       │                     │                         │                           │
       └─────────────────────┴─────────────────────────┴───────────────────────────┘
                                           │
                    ┌──────────────────────▼──────────────────────┐
                    │              SHARED PYTHON LIBRARY          │
                    │   shared/config  shared/database  providers │
                    └──────────────────────┬──────────────────────┘
                                           │
                    ┌──────────────────────▼──────────────────────┐
                    │               MONGODB ATLAS / LOCAL         │
                    │   users · documents · payment_orders · pay  │
                    └─────────────────────────────────────────────┘
```

---

## 📁 Backend Structure — True Microservices

```
backend/
├── shared/                              # Shared library imported across all services
│   ├── config/
│   │   └── settings.py                  # Centralized configuration (reads .env)
│   ├── database/
│   │   ├── mongo.py                     # Motor async client & database connection
│   │   ├── user_repo.py                 # Users, Admin operations & subscription records
│   │   └── document_repo.py             # Document storage and status lifecycle
│   ├── providers/
│   │   ├── llm.py                       # Ollama async provider interface
│   │   ├── embedding.py                 # SentenceTransformer embeddings singleton
│   │   └── vector_store.py              # FAISS vector store managers
│   ├── security/
│   │   └── jwt.py                       # JWT token creation and validation
│   └── storage/
│       └── provider.py                  # Local disk storage abstractions
│
├── services/
│   ├── api_gateway/                     ← PORT 5000 (Public Gateway)
│   │   └── main.py                      # Reverse proxy forwarding to ports 8001-8004
│   │
│   ├── auth_service/                    ← PORT 8001
│   │   ├── main.py                      # Auth FastAPI app
│   │   ├── router.py                    # /api/auth endpoints, Google OAuth & Admin
│   │   ├── service.py                   # Auth business logic, OTP verification
│   │   └── notification/service.py      # Email notification dispatcher
│   │
│   ├── document_service/                ← PORT 8002
│   │   ├── main.py                      # Document management FastAPI app
│   │   ├── router.py                    # Upload, stream, delete & 5-doc quota check
│   │   └── service.py                   # Storage validation & file streaming
│   │
│   ├── rag_service/                     ← PORT 8003
│   │   ├── main.py                      # RAG pipeline FastAPI app
│   │   ├── router.py                    # /summarize, /result & /cancel endpoints
│   │   ├── service.py                   # Ingestion orchestrator & LLM prompt caller
│   │   ├── extraction.py                # Text extraction (PDF & Word)
│   │   ├── analysis/prompts.py          # Corporate legal rules & JSON prompt schemas
│   │   └── ingestion_worker/tasks.py    # Self-healing background worker
│   │
│   └── payment_service/                 ← PORT 8004 (PhonePe Payment Gateway)
│       ├── main.py                      # Payment FastAPI app
│       ├── router.py                    # /plans, /create-order, /verify, /upi-qr, /history
│       ├── service.py                   # PhonePe Standard Checkout v2 & OAuth Client
│       └── __init__.py
│
├── scripts/
│   ├── build_index.py                   # Generates global FAISS index from IT corporate law
│   └── __init__.py
│
├── run_dev.py                           # Development launcher for all services
├── run_all.py                           # Single-terminal multi-process supervisor
├── requirements.txt                     # All Python dependencies
├── Dockerfile                           # Backend container configuration
└── .env.example                         # Environment variables template
```

---

## 🖥️ Frontend Structure — Feature-Sliced Design

```
frontend/
├── src/
│   ├── core/                            # Application framework & navigation
│   │   ├── App.jsx                      # Root gate (Auth checks & routing)
│   │   ├── LayoutView.jsx               # Responsive layout with TopBar & Sidebar
│   │   ├── SidebarView.jsx              # Navigation, Pro/Admin badge, theme toggle
│   │   └── TopBarView.jsx               # Header with breadcrumbs & PRO indicator
│   │
│   ├── features/
│   │   ├── subscription/                # PhonePe Payments & Subscriptions
│   │   │   └── views/
│   │   │       └── PricingView.jsx      # Free vs. Pro comparison, PhonePe embedded modal & auto-verification
│   │   │
│   │   ├── auth/                        # Authentication & onboarding
│   │   │   ├── views/
│   │   │   │   ├── UserLoginView.jsx    # User login & signup with Google OAuth
│   │   │   │   ├── AdminLoginView.jsx   # Dedicated administrator portal
│   │   │   │   └── LoginView.jsx        # Unified dispatcher
│   │   │   └── models/authStore.js      # Session & credentials state
│   │   │
│   │   ├── onboarding/
│   │   │   └── QuickTourModal.jsx       # Guided onboarding tour
│   │   │
│   │   ├── profile/
│   │   │   └── views/
│   │   │       ├── ProfilePageView.jsx  # Account details, subscription status & upgrade link
│   │   │       └── UserProfileModal.jsx # Profile edit modal
│   │   │
│   │   ├── documents/                   # Document analysis suite
│   │   │   ├── views/
│   │   │   │   ├── DocumentsView.jsx    # Risk Score, clauses & quota banner
│   │   │   │   ├── UploadAreaView.jsx   # Drag & drop upload area with Pro upgrade prompt
│   │   │   │   └── FileViewerView.jsx   # PDF / text document viewer
│   │   │   └── models/fileStore.js      # Document state & real-time polling
│   │   │
│   │   ├── dashboard/
│   │   │   └── views/DashboardView.jsx  # Main hub, statistics & recent uploads
│   │   │
│   │   └── admin/                       # Platform administration
│   │       └── views/
│   │           ├── AdminPanelView.jsx   # Admin overview dashboard
│   │           ├── AdminUsersView.jsx   # User management table (Admin vs. Pro vs. Standard)
│   │           └── AdminUserDetailView.jsx # Individual user audit & quota reset
│   │
│   ├── shared/
│   │   ├── ui/
│   │   │   └── LegalBuddyLogo.jsx       # Custom brand SVG emblem & typography
│   │   ├── utils/
│   │   │   └── api.js                   # Unified API client (supports VITE_API_URL & paymentAPI)
│   │   └── store/uiStore.js             # Theme (Dark/Light) & page state
│   │
│   ├── assets/legalbuddy-logo.svg       # Brand vector asset
│   └── index.css                        # TailwindCSS design tokens & dark styling
│
├── Dockerfile                           # Frontend production Nginx container
├── vercel.json                          # Production deployment & SPA rewrites
├── vite.config.js                       # Vite bundler build settings
└── .env.example                         # Frontend environment variables template
```

---

## 🌐 API Reference

### Payments & Subscriptions — `/api/payments`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/payments/plans` | Public | List available subscription tiers (Basic Free & Pro ₹199) |
| `GET` | `/api/payments/subscription` | Bearer Token | Current user active plan, days remaining, and unmetered status |
| `POST` | `/api/payments/create-order` | Bearer Token | Create PhonePe Checkout v2 order with dynamic UPI QR & hosted URL |
| `POST` | `/api/payments/verify` | Bearer Token | Background auto-verification via PhonePe Status API; activates 30-day Pro |
| `POST` | `/api/payments/phonepe/create-order` | Bearer Token | Dedicated PhonePe order creation endpoint |
| `POST` | `/api/payments/phonepe/verify` | Bearer Token | Dedicated PhonePe verification and subscription activation endpoint |
| `GET` | `/api/payments/upi-qr` | Bearer Token | Dynamic UPI deep link and QR code for direct scan |
| `POST` | `/api/payments/phonepe/webhook` | Public | Server-to-server callback notification handler from PhonePe |
| `GET` | `/api/payments/history` | Bearer Token | User's billing receipts and transaction history |

### Authentication & Users — `/api/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/signup` | Public | Register new user with IT role & specialization |
| `POST` | `/api/auth/login` | Public | Sign in with email, password & reCAPTCHA |
| `POST` | `/api/auth/google` | Public | Authenticate or register using Google OAuth 2.0 |
| `POST` | `/api/auth/verify-otp` | Public | Verify 6-digit OTP (or master bypass `999888`) |
| `GET` | `/api/auth/me` | Bearer Token | Retrieve current logged-in user profile & quota |
| `PUT` | `/api/auth/profile` | Bearer Token | Update user profile details and corporate role |
| `GET` | `/api/auth/admin/users/all` | Admin Token | List all users with Admin, Pro, and Standard statuses |
| `POST` | `/api/auth/admin/users/reset-limit/{id}` | Admin Token | Reset user daily upload counter back to 0 |
| `POST` | `/api/auth/admin/users/toggle-role/{id}` | Admin Token | Toggle user between User and Admin role |
| `DELETE` | `/api/auth/admin/users/{id}` | Admin Token | Permanently remove a user account |

### Documents — `/api/documents`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/documents/upload` | Bearer Token | Upload PDF/Word document (Quota checked: Unlimited for Pro) |
| `GET` | `/api/documents` | Bearer Token | List all uploaded documents for current user |
| `GET` | `/api/documents/{id}` | Bearer Token | Get document metadata & analysis state |
| `DELETE` | `/api/documents/{id}` | Bearer Token | Delete document and stored disk files |
| `GET` | `/api/documents/{id}/file` | Bearer Token | Stream file content for preview |
| `POST` | `/api/documents/{id}/cancel` | Bearer Token | Cancel in-flight analysis |

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

# ── MongoDB Database ────────────────────────────────────────────
MONGODB_URL=mongodb+srv://<user>:<password>@cluster.mongodb.net/?appName=legalbuddy
MONGODB_DB=legalbuddy

# ── Security & Authentication ────────────────────────────────────
JWT_SECRET=your-secure-random-secret-key
JWT_EXPIRE_HOURS=24
MASTER_OTP=999888

# ── Admin Account ────────────────────────────────────────────────
ADMIN_EMAILS=admin@legalbuddy.com
ADMIN_NOTIFICATION_EMAIL=admin@legalbuddy.com

# ── PhonePe Payment Gateway (Standard Checkout v2 & UPI QR) ──
DEFAULT_PAYMENT_GATEWAY=phonepe
PHONEPE_CLIENT_ID=M23WEKMWJ0T6Z_2611151446
PHONEPE_CLIENT_VERSION=1
PHONEPE_CLIENT_SECRET=OTFmODgzNjItNWFmMy00YTkzLTgwODAtNjdjNjA2YmZkNGM0
PHONEPE_MERCHANT_ID=M23WEKMWJ0T6Z
PHONEPE_SALT_KEY=96434309-7796-489d-8924-ab56988a6076
PHONEPE_SALT_INDEX=1
PHONEPE_ENV=UAT

# ── Ollama Local / Cloud LLM ────────────────────────────────────
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen3:1.7b
OLLAMA_TIMEOUT=120

# ── File Limits & RAG ────────────────────────────────────────────
MAX_FILE_SIZE_MB=50
CHUNK_SIZE_WORDS=500
CHUNK_OVERLAP_WORDS=100
TOP_K_GLOBAL=5
TOP_K_LOCAL=3
CONTEXT_MAX_CHARS=1500
FAISS_INDEX_PATH=output/faiss_index.bin
FAISS_METADATA_PATH=output/metadata.pkl

# ── CORS Origins ─────────────────────────────────────────────────
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Frontend Configuration (`frontend/.env`)

```env
# ── Backend API Gateway URL ──────────────────────────────────────
VITE_API_URL=http://localhost:5000

# ── Google OAuth 2.0 Client ID ───────────────────────────────────
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# ── Google reCAPTCHA v2 ──────────────────────────────────────────
VITE_RECAPTCHA_SITE_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI

# ── Payment Gateway Selection ────────────────────────────────────
VITE_DEFAULT_PAYMENT_GATEWAY=phonepe
```

---

## 🚀 Installation & Running

### 1. Quick 1-Click Launcher (Windows)

Double-click `start_dev.bat` in the project root:
- Automatically launches all 5 backend microservices on ports `5000`, `8001`, `8002`, `8003`, `8004`.
- Automatically starts the Vite frontend on `http://localhost:5173`.

---

### 2. Docker Compose (Containerized — macOS / Linux / Windows)

The entire LegalBuddy ecosystem can be booted with a single command via Docker Compose:

```bash
# From the repository root (where docker-compose.yml is located):
docker compose up --build
```

**Services Launched:**
- **Frontend Container**: `http://localhost:5173` (Lightweight Alpine Nginx with SPA routing)
- **Backend Container**: `http://localhost:5000` (API Gateway + 4 microservices on 8001, 8002, 8003, 8004)
- **Host Ollama Bridge**: Automatically routes `host.docker.internal:11434` to your host machine's Ollama instance.

To stop the containers:
```bash
docker compose down
```

---

### 3. Manual Step-by-Step Execution

#### Step 1: Install Ollama & Pull Model
```bash
# Install from https://ollama.com
ollama pull qwen3:1.7b
```

#### Step 2: Start Backend Microservices
```bash
cd backend

# Create & activate virtual environment
python -m venv venv

# Windows:
.\venv\Scripts\activate
# macOS / Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run all microservices together
python run_all.py
# (Or run_dev.py to spawn individual terminal windows)
```

Backend gateway will be available at **`http://localhost:5000`**.

#### Step 3: Start Frontend Dev Server
```bash
cd frontend

npm install
npm run dev
```

Visit the app at **`http://localhost:5173`**.

---

## 👥 User Roles & Tiers

LegalBuddy supports three distinct account levels:

| Role / Tier | Quota | Badges | Privileges |
|---|---|---|---|
| 🛡️ **Platform Administrator** | **Unlimited** | `ADMIN` (Purple) | Full access to Admin Console, user management, limit resets, role promotions, and platform metrics. |
| ⭐ **Pro Subscriber** | **Unlimited** | `PRO USER` (Orange/Emerald) | **Unlimited** document uploads, priority AI queue, ICA Sec 27 enforceability checking, full PDF/DOCX reports. Activated via ₹199/month PhonePe checkout. |
| 👤 **Standard User** | **5 Docs / Day** | `STANDARD` (Blue) | 5 Document uploads per day, core clause extraction, risk scoring. Can upgrade anytime to Pro. |

---

## 🛠️ Tech Stack Summary

### Backend
- **FastAPI 0.115** — High-performance async microservices and API Gateway.
- **MongoDB & Motor** — Asynchronous NoSQL document store with dedicated `payment_orders` and `payments` collections.
- **PhonePe Payment Gateway v2 SDK** — OAuth client credentials, dynamic UPI QR generation, and server-to-server status verification.
- **Ollama** — Local, privacy-first LLM inference engine.
- **SentenceTransformers & FAISS** — Dense semantic embeddings (`all-MiniLM-L6-v2`) and vector search.
- **pdfplumber & python-docx** — Reliable document text extraction.
- **SlowAPI** — Rate limiting and traffic throttling.

### Frontend
- **React 19 & Vite 6** — Modern component framework and build toolchain.
- **PhonePe Checkout Experience** — Seamless, in-page full-size modal with real-time background auto-status detection.
- **TailwindCSS 4** — Unified dark/light design system with custom brand tokens.
- **Zustand** — Lightweight modular global state (`authStore`, `fileStore`, `uiStore`).
- **@react-oauth/google** — Google Identity OAuth 2.0 integration.
- **Framer Motion & Lucide Icons** — Micro-interactions, animated states, and visual cues.

---

## 🔒 Security Features

- **Local LLM Privacy**: Sensitive corporate IT agreements stay strictly within the local host environment.
- **PhonePe SHA256 & OAuth Tokens**: All PhonePe payment orders and status queries authenticated via secure OAuth 2.0 and SHA256 cryptographic verification.
- **bcrypt Password Hashing**: Zero plain-text credentials stored in MongoDB.
- **JWT Authentication**: Configurable token expiration and bearer headers.
- **Master OTP Bypass (`999888`)**: Sandboxed bypass code for development and testing without SMTP dependency.
- **Scoped User Ownership**: All document, upload, and payment queries strictly enforce authenticated user IDs.

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
| `Payment modal doesn't open` | PhonePe API credentials missing or invalid | Ensure `PHONEPE_CLIENT_ID` and `PHONEPE_CLIENT_SECRET` in `backend/.env` are correctly configured. |
| `Payment verification pending` | In-flight transaction or waiting for UPI authorization | Wait a few seconds for background poller to auto-complete, or use Fullscreen simulator in UAT mode. |
| `Connection refused on port 11434` | Ollama service is not running | Run `ollama serve` in a terminal or launch the Ollama app. |
| `CORS Error on API Call` | Origin mismatch or port issue | Ensure `CORS_ORIGINS` in `backend/.env` contains your frontend URL. |
| `Upload rejected / Limit reached` | 5 docs daily cap on Basic Free plan | Upgrade to Pro (₹199/mo) via the Plans & Pricing tab for unlimited uploads. |

<div align="center">

Built with ❤️ by **Kritik Kaushik**, **Pankaj Singh Bisht**, **Harpreet Singh**, **Ahana Gupta**, **Kamakshi Arora**, **Lakshya Kansal** and Team.

</div>
