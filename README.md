# 📊 Lead Management Dashboard (Full-Stack CRM)

A **production-deployed, full-stack CRM & Analytics Dashboard** built with **React (Vite), Node.js, MongoDB**, and **Recharts**.

The system focuses on **lead movement, conversion velocity, and funnel behavior**, not vanity metrics.

---

## 🌐 Live Deployment

**Frontend (Vercel)**
👉 [https://lead-management-dashboard-wheat.vercel.app](https://lead-management-dashboard-wheat.vercel.app)

**Backend API (Render)**
👉 [https://leadmanagementdashboard.onrender.com](https://leadmanagementdashboard.onrender.com)

> ⚠️ Note: Backend is hosted on Render free tier and may take **30–50 seconds** to wake up on first request.

---

## 🔑 Demo Credentials

Use the following credentials to log in:

```
Email: admin@example.com
Password: admin123
```

> These credentials are seeded into the production database.

---

## 🚀 Key Features

### 🔐 Authentication

* JWT-based authentication
* Protected API routes via middleware
* Token-based session handling on frontend

### 🧑‍💼 Lead Management

* Create, update, delete leads
* Inline stage editing
* Bulk actions (update stage, delete, export CSV)
* Advanced filters:

  * Name / email / company search
  * Stage filter
  * Date range filter
* Expandable lead detail rows

### 📈 Analytics Dashboard (Core Focus)

* Lifetime vs time-filtered analytics
* Funnel flow (actual stage transitions)
* Stage velocity (time between stages)
* Conversion momentum
* Trend classification (growth / decline / stable)
* KPI cards (conversion rate, contact rate, avg daily leads)

---

## 🗂️ Project Structure

```
├── backend
│   ├── controllers
│   ├── middleware
│   ├── models
│   ├── routes
│   ├── seed.js
│   └── server.js
│
├── frontend
│   ├── src
│   │   ├── pages
│   │   ├── components
│   │   ├── services
│   │   └── App.jsx
│   ├── vite.config.js
│   └── vercel.json
│
└── README.md
```

---

## ⚙️ Tech Stack

### Frontend

* React (Vite)
* Tailwind CSS
* Recharts
* Axios
* React Router

### Backend

* Node.js (Express)
* MongoDB (Mongoose)
* JWT Authentication
* bcrypt
* CORS middleware

---

## 🛠️ Local Setup Instructions

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/CodeBunny09/LeadManagementDashboard.git
cd LeadManagementDashboard
```

---

### 2️⃣ Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in `/backend`:

```env
PORT=5000
MONGO_URI=mongodb+srv://pratikisawesom3_db_user:4IfG9xqvppytXSmI@leadsdb.swfosk2.mongodb.net/lead_dashboard?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret
```

Start the backend:

```bash
npm start
```

Backend runs at:

```
http://localhost:5000
```

---

### 3️⃣ Seed the Database (Required)

To create demo users and sample leads:

```bash
node seed.js
```

This will:

* Create a default admin user
* Populate sample leads with stage history

---

### 4️⃣ Frontend Setup

```bash
cd ../frontend
npm install
```

Create a `.env` file in `/frontend`:

```env
VITE_API_URL=http://localhost:5000
```

Run the frontend:

```bash
npm run dev
```

Frontend runs at:

```
http://localhost:5173
```

---

## 🔌 API Overview

### Authentication

* `POST /api/auth/login`
* `POST /api/auth/register`

### Leads

* `GET /api/leads`
* `POST /api/leads`
* `PUT /api/leads/:id`
* `DELETE /api/leads/:id`

### Analytics

* `GET /api/analytics`
* `GET /api/analytics/history`

> 🔐 All routes (except auth) require `Authorization: Bearer <token>`.

---

## 🧪 Debugging Utilities

A `debug.sh` script is included to inspect:

* Environment setup
* Dependency resolution
* Build outputs
* Port usage

```bash
chmod +x debug.sh
./debug.sh
```

---

## 🖼️ Screenshots

| Dashboard                                 | Leads                              | Analytics                              |
| ----------------------------------------- | ---------------------------------- | -------------------------------------- |
| ![](./screenshots/dashboard-overview.png) | ![](./screenshots/leads-table.png) | ![](./screenshots/conversion-flow.png) |

---

## 🧠 Design Philosophy

* Analytics focus on **movement**, not static counts
* Time-aware metrics over raw totals
* Clear separation between **lifetime** and **filtered insights**
* Production-first mindset (auth, CORS, deployment)

---

## 📌 Future Enhancements

* Role-based access (Admin / Sales)
* Real-time updates via WebSockets
* Export analytics as PDF
* Per-user performance tracking
* Customizable dashboards

---

## 👤 Author

**CodeBunny09**
Built as a **production-deployed CRM analytics system**.