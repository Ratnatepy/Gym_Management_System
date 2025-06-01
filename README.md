
# Gym Management System

A comprehensive gym management solution with frontend, backend, admin dashboard, and RMI service components.

## 🏗 System Architecture

```
bigboss-gym/
├── frontend/            # Member-facing website (HTML/CSS/JS)
├── backend/             # Node.js Express REST API
├── admin-dashboard/     # Admin interface
└── rmi-service/         # Java RMI service for chatbot functionality
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v14+)
- Java JDK (v11+)
- npm/yarn

### 1. Start Backend Server
```bash
cd backend
npm install
node server.js
```
API server will run at `http://localhost:5000/`

### 2. Start RMI Service (GymBot)
```bash
cd rmi-service
javac -cp . bigboss/rmi/*.java
java -cp . bigboss.rmi.GymServer
```
The RMI chatbot service will start and be ready for client connections.

### 3. Launch Frontend
```bash
# Using Live Server (recommended)
open frontend/index.html
```

### 4. Access Admin Dashboard
```bash
open admin-dashboard/index.html
```

## 🌐 API Endpoints
All endpoints are available at `http://localhost:5000/api/`

| Endpoint       | Description                |
|----------------|----------------------------|
| `/members`     | Member management          |
| `/payments`    | Payment processing         |
| `/trainers`    | Trainer information        |
| `/feedback`    | Member feedback            |

## 🤖 GymBot RMI Service
The Java RMI service provides automated responses to common gym inquiries:

**Supported Queries:**
- Membership information ("What are the membership types?")
- Payment methods ("How do I make a payment?")
- Pricing details ("How much does it cost to join?")
- Class schedules ("Can I see the class schedule?")
- Trainer information ("Tell me about the trainers")
- Contact details ("How can I contact support?")
- Operating hours ("What are your opening hours?")

**Example Interaction:**
```
Client: How do I make a payment?
Server: You can pay via Visa, MasterCard, ABA, or Wing. Just go to the Payments page.
```


## 📬 Contact Me Via
```
Email : bunratnatepy@gmail.com or Telegram: +855 11 434 668
```
