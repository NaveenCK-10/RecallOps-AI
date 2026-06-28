# RecallOps AI 🚀
**Never Solve The Same Production Incident Twice**

RecallOps AI is an autonomous, memory-augmented incident resolution engine built for the next generation of Site Reliability Engineering. By intelligently aggregating production logs and augmenting large language models (LLMs) with a persistent, semantic vector memory of previous incidents, RecallOps ensures that your engineering team never debugs the same problem twice.

---

## 🌟 The Problem
Engineering teams repeatedly spend hours debugging the same production issues because previous solutions are scattered across Slack, Jira, emails, documentation, and engineers' memories. When an alert fires, valuable time is wasted rediscovering the root cause.

## 💡 The Solution
RecallOps AI acts as an autonomous SRE memory engine:
1. **Intelligent Ingestion:** Paste raw exceptions, Datadog alerts, or Kibana logs directly into the engine.
2. **Hindsight Persistent Memory:** Powered by `@vectorize-io/hindsight-client`, it semantically searches past incidents to augment the LLM context.
3. **CascadeFlow Routing:** Powered by `@cascadeflow/core`, it dynamically routes requests to the optimal LLM (e.g., Mistral Nemotron or Llama 3.1) based on incident complexity and memory context—optimizing for speed and cost.
4. **Actionable Resolution:** Generates a structured root cause analysis and a step-by-step resolution plan.

---

## 🏗 Architecture & Tech Stack

### Core Technologies
*   **Frontend:** React (Vite), Tailwind CSS v4 (Custom Glassmorphism Theme), Framer Motion, Lucide Icons.
*   **Backend:** Node.js, Express.js.
*   **Intelligence Layer (NVIDIA API Catalog):**
    *   `mistralai/mistral-nemotron` (Primary reasoning model)
    *   `nvidia/llama-3.1-nemotron-70b-instruct` (Complex tasks)
*   **SDKs & Tooling:**
    *   `@vectorize-io/hindsight-client` (Semantic memory storage and retrieval)
    *   `@cascadeflow/core` (Intelligent LLM routing, cost calculation, and latency optimization)

### Folder Structure
```
RecallOps/
├── backend/                  # Express.js REST API
│   ├── config/               # Environment & setup
│   ├── data/                 # Sample incident datasets
│   ├── routes/               # API endpoints (analyze, memory, runtime)
│   ├── services/             # Core business logic
│   │   ├── cascadeflowService.js # SDK integration for model routing
│   │   ├── hindsightService.js   # SDK integration for semantic memory
│   │   └── nvidiaService.js      # NVIDIA API inference (Mistral Nemotron)
│   └── server.js             # Entry point
├── frontend/                 # React UI
│   ├── src/
│   │   ├── assets/           # Static assets
│   │   ├── context/          # Global AppState (Incidents, Analytics)
│   │   ├── layouts/          # Main responsive shell
│   │   ├── pages/            # Dashboard, Analyze, Memory, Analytics
│   │   ├── services/         # Axios API layer
│   │   ├── App.jsx           # Application routing
│   │   └── main.jsx          # React entry point
│   └── index.css             # Tailwind v4 theme configuration
└── README.md
```

---

## 🚀 Features

-   **Autonomous Root Cause Analysis:** Translates cryptic stack traces into plain English explanations.
-   **Memory-Augmented Generation (RAG):** Uses the Hindsight SDK to fetch prior incident resolutions, passing them as context so the LLM doesn't "hallucinate" novel fixes for known issues.
-   **Dynamic Model Routing:** Uses the CascadeFlow SDK to classify incident complexity. Simple or memory-backed incidents are routed to faster/cheaper models, while novel critical issues use heavy models.
-   **Runtime Dashboard:** Full observability into LLM token usage, latency, and cost savings.
-   **Glassmorphism UI:** A premium, modern interface designed to "wow" users instantly.

---

## 🛠 Installation & Local Setup

### Prerequisites
- Node.js v18+
- NVIDIA API Key (`mistralai/mistral-nemotron`)

### 1. Clone & Install
```bash
git clone https://github.com/your-org/recallops-ai.git
cd recallops-ai

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configuration
Create a `.env` file in the `backend/` directory:
```env
PORT=3001
NODE_ENV=development
NVIDIA_API_KEY=your_nvidia_api_key_here
```

### 3. Run the Application
You need to run both the frontend and backend servers.

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```
Navigate to `http://localhost:5173` in your browser.

---

## 🎬 Demo Instructions (60-Second Flow)

1.  **Dashboard:** Start on the Dashboard to view the system overview. Note the "System Integrations" showing "Online".
2.  **Analyze Incident:** Click "Analyze New Incident".
3.  **Input:** Click "Load Sample" to load a raw PostgreSQL connection pool exhaustion log.
4.  **Process:** Click "Analyze with AI". Watch the pipeline animation as it queries Hindsight, routes via CascadeFlow, and runs NVIDIA inference.
5.  **Review:** Observe the structured output. Notice the **Hindsight Context** card showing it found a similar past incident and augmented the model. Notice the **CascadeFlow Decision** card showing the model routed to and the execution latency/cost.
6.  **Memory Timeline:** Navigate to the "Memory" tab to view the persistent vector database of all past incidents.

---

## 🔮 Future Scope
*   **Slack/PagerDuty Integration:** Automatically ingest alerts directly from webhooks.
*   **Automated Runbooks:** Generate Terraform/Kubernetes scripts to automatically apply fixes based on the LLM's resolution plan.
*   **Team Knowledge Graphs:** Connect PRs, Jira tickets, and Confluence docs into the Hindsight memory bank.

---
*Built for the AI Agents Hackathon.*
