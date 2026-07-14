# Demo Ticket | Premium Enterprise Helpdesk & Ticketing System

Demo Ticket is a modern, responsive, full-stack Ticketing System built using a premium dark-themed React frontend, a Node.js + Express backend, and Firebase as the backend database and authentication service. It is designed to provide a fast, responsive user experience with role-based access control and AI-assisted ticket metadata predictions.

## 🚀 Tech Stack

* **Frontend:** React (v19 with Vite), Vanilla CSS, Lucide React
* **Backend:** Node.js, Express.js
* **Database:** Firebase Firestore
* **Authentication:** Firebase Authentication
* **AI Engine:** OpenAI Node SDK (falls back to a local heuristic classification engine when no API key is provided)

---

## ✨ Features Implemented

### Dashboard & Analytics

* Real-time dashboard with ticket statistics.
* Ticket counts by status and priority.
* Completion progress meter.

### Ticket Management

* Create, view, update, and delete tickets.
* Search tickets by title and description.
* Filter by status, priority, category, and assignee.

### AI Ticket Suggestions

* Automatically suggests ticket priority and category based on the ticket description.
* Falls back to a local keyword-based classifier when no OpenAI API key is configured.

### Activity Timeline

* Displays ticket comments.
* Tracks ticket updates such as status changes, priority updates, and assignee changes.

### Role-Based Access Control

**User**

* Create support tickets.
* View and comment on their own tickets.

**Agent**

* View all tickets.
* Update ticket status, priority, and assignee.
* Add comments.

**Admin**

* Full system access.
* Manage all tickets and users.
* Delete tickets.

---

## 🛠 Installation & Setup

### Prerequisites

* Node.js (v18 or later)
* npm

### Installation

Navigate to the project folder:

```bash
cd ticketing-system
```

Install dependencies:

```bash
npm run install:all
```

Configure Firebase credentials in your project.

Create a `.env` file inside the backend folder and add your Firebase configuration:

```env
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY=your_private_key
OPENAI_API_KEY=your_openai_api_key
```

Start the development server:

```bash
npm run dev
```

Frontend:

```
http://localhost:5173
```

Backend:

```
http://localhost:5000
```

---

## 🔑 Demo Access

Demo accounts (if seeded into Firebase):

### Admin

* Username: admin
* Password: admin123

### Agent

* Username: agent
* Password: agent123

### User

* Username: user
* Password: user123

You can also register a new account through the application's registration page if enabled.

---

## 🔥 Firebase Integration

This application uses **Firebase Firestore** as the primary database.

* Stores users, tickets, comments, and activity logs.
* Provides scalable cloud-based data storage.
* Supports real-time data synchronization (if enabled).
* Integrates with Firebase Authentication for secure user login and role management.

---

## 🤖 AI Suggestion Engine

If an `OPENAI_API_KEY` is available, the application uses OpenAI to predict:

* Ticket Priority
* Ticket Category

If no API key is configured, the application automatically switches to a lightweight keyword-based classifier that detects words such as:

* urgent
* crash
* password
* wifi
* network
* hardware
* software

This ensures the AI suggestion feature remains functional without external API access.

---

## 📝 Design Decisions

### Firebase Backend

The application stores all ticketing data in Firebase Firestore, eliminating the need for MongoDB installation or configuration.

### Authentication

Firebase Authentication securely manages user accounts and role-based access control.

### AI Fallback

When the OpenAI API is unavailable, a built-in heuristic engine provides ticket classification to keep the application fully functional.

### Activity Logging

Every ticket update—including status changes, reassignment, priority updates, and comments—is automatically recorded in the activity timeline for complete audit tracking.
