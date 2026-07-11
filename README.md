# Demo Ticket | Premium Enterprise Helpdesk & Ticketing System

VeloTick is a modern, responsive, full-stack Ticketing System built using a premium dark-themed React frontend, a Node.js + Express backend, and a Mongoose (MongoDB) database layer. It is designed to look outstanding, provide lightning-fast interactions, and support role-based access controls and AI-assisted metadata predictions.

---

## 🚀 Tech Stack

- **Frontend**: React (v19 scaffolded with Vite), Vanilla CSS (responsive, glassmorphism overlays, custom animations), Lucide React (for premium typography icons).
- **Backend**: Node.js, Express.js, Mongoose (MongoDB).
- **Database**: MongoDB (supports both a remote cluster connection and a transparent local in-memory fallback for zero-configuration testing).
- **AI Engine**: OpenAI Node SDK (falling back to a local heuristic classification engine when no API key is specified).

---

## ✨ Features Implemented

1. **Dashboard Operational Insights**: High-level visual cards detailing ticket counts by status, priority, and a real-time completion progress meter.
2. **Ticket CRUD & Custom Filters**: Complete ticket life-cycle management. Supports title/description search, status filter, priority filter, and assignee filter.
3. **AI Auto-Suggest Details**: Analyzes ticket description to auto-suggest ticket priority (low, medium, high) and category (Access, Software, Hardware, Network, etc.) with a single click.
4. **Interactive Audit & Comments Feed**: Complete activity timeline displaying audit logs (status changes, assignee changes) and user comments.
5. **Role-Based Access Control**:
   - **User**: Can raise tickets, comment on them, and view only tickets they created.
   - **Agent**: Can view all tickets, comment, and change ticket status, priority, and assignees.
   - **Admin**: Full access. Can execute all operations, including deleting tickets.

---

## 🛠️ Installation & Setup

### Prerequisites
Ensure you have **Node.js** (v18+) and **npm** installed on your system.

### Steps
1. Navigate to the project root directory:
   ```bash
   cd ticketing-system
   ```
2. Install all dependencies across the workspace (root, backend, and frontend) using the shortcut script:
   ```bash
   npm run install:all
   ```
3. Run the development environment concurrently:
   ```bash
   npm run dev
   ```
   - **Frontend URL**: `http://localhost:5173/`
   - **Backend API URL**: `http://localhost:5000/`

---

## 🔑 Seeding & Demo Access
The system automatically seeds the database with the following demo profiles on startup:

- **Admin Profile** (Full privileges + Ticket Deletion)
  - Username: `admin`
  - Password: `admin123`
- **Agent Profile** (Access all tickets + Assign & update statuses)
  - Username: `agent`
  - Password: `agent123`
- **User Profile** (Create tickets + View/comment own tickets only)
  - Username: `user`
  - Password: `user123`

*You can also use the **Register** tab on the login screen to create a custom user account and pick your profile type.*

---

## 📝 Assumptions & Fallback Design Decisions

1. **Database Fallback**: To guarantee that the application starts up instantly without requiring a pre-installed MongoDB server, the backend automatically uses `mongodb-memory-server` to run a temporary MongoDB instance in memory. To connect to a persistent database, simply specify the connection string in the backend `.env` file under `MONGODB_URI`.
2. **OpenAI Suggestion Heuristic**: If an `OPENAI_API_KEY` is not provided in the backend `.env` file, the `/api/tickets/suggest` endpoint falls back to a regex-based heuristic classifier. This parses the description text for support keywords (e.g. "urgent", "crash", "wifi", "password") to auto-suggest the priority and category so the feature remains functional and testable out-of-the-box.
3. **Audit Log Timeline**: Status changes (e.g. changing status to "In Progress" or assigning to an agent) automatically trigger a system activity log that appends to the ticket comments timeline. This makes it easy to track historical activity.
