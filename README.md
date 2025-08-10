# 🚀 Campus Connect – Backend & Prototype Frontend

**Campus Connect** is a platform designed to help students, faculty, and admins connect, collaborate, and share opportunities inside a campus ecosystem.  
This repository currently contains the **backend service** and a **prototype frontend** for Phase 1 development.

---

## 📌 Phase 1 – Roles & Responsibilities

### **Sarvesh Malandkar – Team Lead (Core Backend + Integration)**
Handles almost all major API design, DB architecture, security, and joining of all parts.

**Tasks:**
- **Project Initialization**
  - Setup backend folder structure, Git repo
  - Configure Express server, middlewares, CORS, `.env`
- **Database Design**
  - Build DB schema (users, projects, posts, messages)
- **Auth System**
  - JWT authentication
  - Role-based access control (Student, Faculty, Admin)
- **Profile API**
  - CRUD for bio, skills, education, GitHub, etc.
- **Post Feed APIs**
  - Create/update/delete posts
  - Like & comment system
- **Faculty Endorsement Logic**
  - Endpoint for faculty to endorse student projects
- **Resume Export**
  - Generate PDF resumes from student data
- **Admin Data Export**
  - Endpoint for placement cell to export profiles
- **Testing**
  - Test and integrate Aditya’s and Shlok’s code with main project

---

### **Aditya Gaikwad – Prototype Frontend Developer**
Focuses on creating a basic but functional frontend to test backend APIs.

**Tasks:**
- **Prototype Frontend Setup**
  - Create React app with routing
  - Configure basic state management
- **Auth Pages**
  - Signup, login forms connected to Sarvesh’s API
- **Profile Pages**
  - Display profile details from backend
  - Edit profile form integration
- **Feed Page**
  - Fetch posts from backend
  - Like, comment buttons linked to API
- **Testing**
  - Test backend endpoints through UI and report issues

---

### **Shlok Chavan – Database & API Support**
Assists Sarvesh in database population and some supporting APIs.

**Tasks:**
- **Database Population**
  - Insert test data for users, posts, and messages
- **Messaging APIs**
  - Support Sarvesh in send/get message endpoints
- **Faculty & Admin Sample Data**
  - Create accounts to test role-based restrictions
- **Testing**
  - Use Postman to validate database writes & reads
  - Confirm role restrictions are working

---

## 📂 Folder Structure
```

├── config/         # Database config, JWT settings
├── controllers/    # Business logic for each route
├── middleware/     # Auth middleware, role-based guards
├── routes/         # All API endpoints
├── supabase/       # Supabase connection/config
├── .env            # Environment variables (NOT committed)
├── server.js       # App entry point
├── package.json

````

---

## ⚙️ Installation

1. **Clone the repo**
```bash
git clone https://github.com/your-username/campus-connect-backend.git
cd campus-connect-backend
````

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**
   Create a `.env` file in the root directory:

```env
PORT=3001
JWT_SECRET=your_generated_secret_key
FRONTEND_URL=http://localhost:3000
DB_URL=your_database_url
```

> 🔑 You can generate a JWT secret with:
>
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

4. **Run the server**

```bash
npm start
```

---

## 🛠 API Endpoints

### Health Check

```
GET /api/health
```

Response:

```json
{
  "status": "OK",
  "message": "Campus Connect Backend is running",
  "timestamp": "2025-08-01T15:32:41.201Z"
}
```

### Authentication

* `POST /api/auth/register` – Create account
* `POST /api/auth/login` – Login and receive JWT token

### Profiles

* `GET /api/profile/:id` – Get user profile
* `PUT /api/profile/update` – Update profile

### Posts

* `POST /api/posts` – Create a post
* `GET /api/posts/feed` – Fetch feed
* `POST /api/posts/:id/like` – Like a post
* `POST /api/posts/:id/comment` – Comment on a post

### Faculty Endorsement

* `POST /api/endorse` – Faculty-only project endorsement

### Resume Export

* `GET /api/resume/:studentId` – Download student resume as PDF

### Admin Export

* `GET /api/admin/export/:studentId` – Export profile data (Admin only)

### Messaging

* `POST /api/messages/send` – Send a message
* `GET /api/messages/:userId` – Get conversation

---

## 🧪 Testing Workflow

**Sarvesh:**

* Hit all API endpoints via Postman
* Validate DB read/write
* Ensure JWT token is required for protected routes

**Aditya:**

* Verify frontend can successfully call all backend APIs
* Ensure UI updates match API responses

**Shlok:**

* Test DB population scripts
* Validate role-based access logic with test accounts

---

## 📌 Phase 1 "Definition of Done"

The backend + prototype frontend are complete when:

* All APIs respond correctly and pass Postman/UI tests
* JWT auth and role-based access work
* Resume & Admin export generate proper PDFs
* Messaging works between two accounts
* Code is pushed to GitHub with documentation

---

## 🔄 Phase 2 – Integration & UI/UX Upgrade Plan

In Phase 2, we will:

1. **Replace the prototype frontend** with a fully designed responsive UI using React + TailwindCSS or Material UI.
2. **Implement real-time features** like messaging and notifications using WebSockets (Socket.IO).
3. **Enhance security** with better validation, rate limiting, and HTTPS setup.
4. **Add media handling** for profile pictures and post images (using Cloudinary or AWS S3).
5. **Integrate AI-powered counseling chatbot** for student queries.
6. **Make dashboards** for Students, Faculty, and Admin with advanced analytics.
7. **Add search & filtering** for projects, skills, and posts.
8. **Improve accessibility** and mobile responsiveness.

**Deliverables for Phase 2:**

* Fully styled frontend
* Connected API calls with better UX
* Real-time chat and notifications
* Secure production-ready deployment plan

---

## 👥 Authors

* **Sarvesh Malandkar** – Backend Lead (Core APIs & Integration)
* **Aditya Gaikwad** – Prototype Frontend Developer
* **Shlok Chavan** – Database & API Support
  **Guide:** Prof. Bhavna Arora

---

