🚀 Autonomous Content Factory

An AI-powered system that automates the entire content creation pipeline — from research to final campaign output — using multiple intelligent agents.

---

  Project Overview

The **Autonomous Content Factory** is a multi-agent system designed to simulate a real-world content production team:

*  **Fact-Check Agent** → Extracts verified information
*  **Copywriter Agent** → Generates content based ONLY on verified data
*  **Editor Agent** → Reviews, validates, and improves content

>  The system ensures **zero hallucination** by using a structured fact-sheet as the single source of truth.

---

  Architecture

```
User Input (File / URL)
        ↓
Fact-Check Agent (Agent 1)
        ↓
Structured Fact-Sheet (JSON/Markdown)
        ↓
Copywriter Agent (Agent 2)
        ↓
Editor Agent (Agent 3)
        ↓
Final Campaign Output
```

---

 🛠️ Tech Stack

### Frontend

* React.js (Vite)
* Modern SaaS UI (Dark theme, Glassmorphism)

### Backend

* Flask (Python)
* REST API architecture

### Database & Auth

* Supabase (PostgreSQL)

### Version Control

* Git + GitHub

---

  UI/UX Design

*  Dark theme with gradient highlights
*  Glassmorphism card-based UI
*  Dashboard-style layout
*  Fully responsive (mobile + desktop)
*  Premium SaaS look

---

  Project Structure

```
autonomous-content-factory/
│
├── backend/
│   ├── agents/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── app.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   ├── components/
│   ├── pages/
│   └── package.json
│
└── .gitignore
```

---

  Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd autonomous-content-factory
```

---

 2. Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

---

 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

  Core Concept

The system follows a **strict data flow rule**:

✔ Agent 1 generates facts
✔ Agent 2 uses ONLY those facts
✔ Agent 3 validates everything

 This prevents AI hallucination and ensures reliability.

---

  Features

* Upload campaign input (file / URL)
* AI agent pipeline execution
* Structured fact extraction
* Multi-format content generation
* Content validation & feedback loop
* Dashboard to monitor agent activity
* Export final campaign kit

---



 Future Improvements

* Real-time agent activity feed
* Advanced tone control for content
* Multi-language support
* Export to PDF / social formats

---

  Why This Project?

This project demonstrates:

* Multi-agent AI system design
* Full-stack development (React + Flask)
* Real-world SaaS architecture
* Clean and scalable code structure

---

  License

This project is for educational and portfolio purposes.
