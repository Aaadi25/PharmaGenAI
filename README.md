# AI-Powered Customer Complaint Management System

Pharmaceutical (API & FDF) customer complaint intake module, built for the
AIVOA Round 1 Full Stack assessment. Mirrors the reference UI: a complaint
form on the left, an AI intake assistant on the right that reads an
uploaded document / pasted email and auto-populates the form.

## Why this matters (QMS context)

In a pharmaceutical Quality Management System, the **Customer Complaint**
module is the entry point for any signal that a marketed product may not
meet quality/safety expectations. It feeds directly into:
- **Triage & risk classification** (is this a patient-safety issue?)
- **Investigation / root cause analysis**
- **CAPA** (Corrective and Preventive Action)
- **Trend analysis & duplicate detection** across batches/customers
- Regulatory reporting obligations (e.g. adverse event escalation)

Getting structured, complete data in *at intake* (batch number, product,
dates, description) is what makes the rest of the QMS workflow possible —
which is why the AI assistant focuses on extraction + completeness +
early risk signal, rather than just being a chatbot bolted onto a form.

## Architecture

```
frontend (React + Redux Toolkit)
   |  drag/drop file or pasted text
   v
POST /api/complaints/extract
   |
   v
backend (FastAPI)
   |
   v
LangGraph pipeline (app/agents/graph.py)
   extract_fields -> completeness_check -> risk_classification
        -> root_cause -> capa_recommendation -> summary
   |  each node calls Groq (gemma2-9b-it for extraction/summary,
   |  llama-3.3-70b-versatile for reasoning-heavy nodes)
   v
JSON returned to frontend -> Redux store -> form auto-populated
   |
   v  (QA reviews/edits, clicks "Save Complaint")
POST /api/complaints  -> Postgres/MySQL (SQLAlchemy)
   |  also runs duplicate-detection (SQL pre-filter + Groq comparison)
   v
saved complaint record with all AI outputs attached
```

Right-panel chat (`/api/assistant/chat`) is a separate lightweight endpoint
that answers questions about the current complaint using the reasoning
model, with the current form state passed as context.

## Bonus AI features implemented

| Feature | Where |
|---|---|
| Complaint Completeness Checker | `completeness_check` node |
| AI Risk Classification | `risk_classification` node |
| Root Cause Recommendation | `root_cause` node |
| CAPA Recommendation | `capa_recommendation` node |
| Complaint Summary | `summary` node |
| Duplicate Complaint Detection | `_find_duplicates()` in `routers/complaints.py`, runs on save |

All of these are visible as "insight cards" in the AI panel after
extraction, and are persisted with the complaint record.

## Setup

### 1. Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

Edit `.env`:
- `GROQ_API_KEY` — create a free key at https://console.groq.com
- `DATABASE_URL` — defaults to MySQL. To use Postgres instead, run
  `pip install psycopg2-binary` and see the comment in `app/database.py`.

Create the database (MySQL example):
```bash
mysql -u root -p
```
```sql
CREATE DATABASE complaints_db;
EXIT;
```

Run the API:
```bash
uvicorn app.main:app --reload --port 8000
```
Tables are auto-created on startup via `Base.metadata.create_all`.
Docs available at http://localhost:8000/docs.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```
Opens at http://localhost:5173, proxying `/api` to the backend on :8000.

### 3. Try it

- Use `backend/sample_data/sample_complaint_email.txt` — drag it onto the
  dropzone, or open it and paste its contents into "Paste Complaint Text".
- Watch the extraction progress bar, then review the auto-populated form
  and the AI insight cards (summary, completeness, risk, root cause, CAPA).
- Edit any field QA disagrees with, then **Save Complaint** — this also
  triggers duplicate detection against existing records.
- Ask the assistant a follow-up question in the chat box at the bottom
  right (e.g. "what's the biggest risk here?").

## Notes / scope decisions

- Document parsing (`services/document_parser.py`) does plain text
  extraction from PDF/DOCX/TXT/EML — sufficient to feed the LLM, not
  production-grade OCR (matches assignment scope).
- `gemma2-9b-it` is used for the fast/cheap extraction and summary steps;
  `llama-3.3-70b-versatile` is used for the reasoning-heavy steps
  (completeness, risk, root cause, CAPA, chat) where quality matters more
  than latency — this split is easy to change in `.env`.
- The DB layer uses SQLAlchemy so switching between Postgres and MySQL is
  a one-line `DATABASE_URL` change (see `app/database.py`).
- No hardcoded API keys anywhere — everything reads from `.env`.
