# AI-Powered Customer Complaint Management System

A Pharmaceutical (API & FDF) Customer Complaint Intake System that combines AI-powered document understanding with a Quality Management System (QMS) workflow. The application features a complaint form alongside an AI intake assistant that reads uploaded documents or pasted emails and automatically extracts and populates complaint information.

## Why this matters (QMS context)

In a pharmaceutical Quality Management System, the **Customer Complaint** module is the entry point for any indication that a marketed product may not meet quality or safety expectations. It directly supports:

* **Triage & Risk Classification** – Determines whether the complaint represents a potential patient safety issue.
* **Investigation & Root Cause Analysis** – Provides structured information for quality investigations.
* **CAPA (Corrective and Preventive Action)** – Helps initiate corrective actions and preventive measures.
* **Trend Analysis & Duplicate Detection** – Identifies recurring issues across products, batches, or customers.
* **Regulatory Compliance** – Supports documentation required for quality and regulatory reporting.

Capturing complete, structured information at the intake stage—such as product details, batch number, manufacturing information, complaint description, and dates—enables efficient downstream quality processes. The AI assistant focuses on intelligent extraction, completeness validation, and early risk identification rather than functioning as a generic chatbot.

---

# Architecture

```text
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
POST /api/complaints -> Postgres/MySQL (SQLAlchemy)
   |  also runs duplicate-detection (SQL pre-filter + Groq comparison)
   v
saved complaint record with all AI outputs attached
```

The right-side AI assistant (`/api/assistant/chat`) is implemented as a lightweight endpoint that answers questions about the current complaint using the reasoning model, with the current form state provided as context.

---

# AI Features

| Feature                        | Implementation                                  |
| ------------------------------ | ----------------------------------------------- |
| Complaint Completeness Checker | `completeness_check` node                       |
| AI Risk Classification         | `risk_classification` node                      |
| Root Cause Recommendation      | `root_cause` node                               |
| CAPA Recommendation            | `capa_recommendation` node                      |
| Complaint Summary              | `summary` node                                  |
| Duplicate Complaint Detection  | `_find_duplicates()` in `routers/complaints.py` |

All AI-generated insights are displayed as information cards within the AI panel after extraction and are stored with the complaint record.

---

# Setup

## 1. Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

Update the `.env` file:

* `GROQ_API_KEY` — Obtain a free API key from https://console.groq.com
* `DATABASE_URL` — Defaults to MySQL. To use PostgreSQL instead:

```bash
pip install psycopg2-binary
```

Refer to the configuration comments in `app/database.py`.

Create the database (MySQL example):

```bash
mysql -u root -p
```

```sql
CREATE DATABASE complaints_db;
EXIT;
```

Start the backend:

```bash
uvicorn app.main:app --reload --port 8000
```

Database tables are automatically created on startup using:

```python
Base.metadata.create_all()
```

API documentation is available at:

```
http://localhost:8000/docs
```

---

## 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on:

```
http://localhost:5173
```

and proxies all `/api` requests to the backend running on port **8000**.

---

## 3. Running the Application

* Open `backend/sample_data/sample_complaint_email.txt`.
* Drag and drop the file into the upload area or paste its contents into **Paste Complaint Text**.
* The AI extracts complaint details and automatically populates the complaint form.
* Review the generated AI insights, including:

  * Complaint Summary
  * Completeness Check
  * Risk Classification
  * Root Cause Recommendation
  * CAPA Recommendation
* Modify any extracted fields if necessary.
* Click **Save Complaint** to store the complaint and trigger duplicate complaint detection.
* Ask follow-up questions using the AI assistant (for example, *"What is the highest risk associated with this complaint?"*).

---

# Technical Notes

* `services/document_parser.py` extracts plain text from PDF, DOCX, TXT, and EML documents. OCR is intentionally outside the project scope.
* `gemma2-9b-it` is used for fast and cost-efficient extraction and summarization.
* `llama-3.3-70b-versatile` is used for reasoning-intensive tasks including completeness checking, risk classification, root cause analysis, CAPA recommendations, and contextual chat.
* SQLAlchemy provides database abstraction, allowing easy switching between MySQL and PostgreSQL through the `DATABASE_URL` environment variable.
* Sensitive configuration such as API keys is managed entirely through environment variables (`.env`), with no credentials hardcoded into the source code.
