# 🎓 Campus Connect

A modern, scalable social networking platform designed exclusively for college students, faculty, and administrators. Built with React, Express.js, and Supabase.

## 🚀 Features

### 👥 **User Management**
- **Secure Authentication**: JWT-based authentication with .edu email validation
- **Role-Based Access**: Student, Faculty, and Admin roles with appropriate permissions
- **Profile Management**: Comprehensive user profiles with academic information

### 📱 **Social Features**
- **News Feed**: Share updates, academic achievements, and campus events
- **Messaging System**: Direct messaging between students and faculty
- **Endorsements**: Faculty can endorse students for skills and achievements
- **Posts & Comments**: Interactive content sharing with like and comment features

### 🔐 **Security & Performance**
- **Row Level Security (RLS)**: Database-level security policies
- **Input Validation**: Comprehensive form validation and sanitization
- **Optimized Queries**: Database indexing for scalable performance
- **Real-time Updates**: Live notifications and messaging

## 🏗️ Architecture

### Frontend (React + Vite)
- **React 18**: Modern React with hooks and context
- **React Router**: Client-side routing
- **Tailwind CSS**: Utility-first styling
- **Axios**: HTTP client for API communication

### Backend (Express.js)
- **Express.js**: RESTful API server
- **JWT Authentication**: Secure token-based authentication
- **Supabase Integration**: PostgreSQL database with real-time features
- **Middleware**: Authentication, validation, and error handling

### Database (Supabase/PostgreSQL)
- **Normalized Schema**: Proper database design with relationships
- **Row Level Security**: User-based data access control
- **Indexes**: Optimized for performance
- **Triggers**: Automated database operations

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Supabase account

### 1. Clone the Repository
```bash
git clone https://github.com/Codeenk/CampusConnect.git
cd CampusConnect
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your actual values
nano .env
```

### 4. Supabase Setup
1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Copy your project URL and API keys to `.env`
3. Run the database migration in Supabase SQL Editor:
   - Copy the content from `supabase/migrations/20250126120000_scalable_schema.sql`
   - Execute it in your Supabase project

### 5. Start Development Servers
```bash
# Start both frontend and backend
npm run dev:all

# Or start individually
npm run dev        # Backend only (port 3001)
npm run frontend   # Frontend only (port 3000)
```

## 🔧 Environment Variables

```env
# Environment
NODE_ENV=development

# Server Configuration
PORT=3001

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

## 📁 Project Structure

```
CampusConnect/
├── src/                          # Frontend React application
│   ├── components/               # Reusable React components
│   ├── contexts/                 # React context providers
│   ├── pages/                    # Page components
│   └── services/                 # API service functions
├── controllers/                  # Express route controllers
├── middleware/                   # Express middleware
├── routes/                       # Express route definitions
├── config/                       # Configuration files
├── supabase/migrations/          # Database migrations
├── server.js                     # Express server entry point
├── package.json                  # Dependencies and scripts
└── README.md                     # This file
```

## 🛣️ API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Profiles
- `GET /api/profile/me` - Get current user profile
- `PUT /api/profile/update` - Update user profile
- `GET /api/profile/all` - Get all profiles (admin)
- `GET /api/profile/:userId` - Get specific user profile

### Posts
- `POST /api/posts/create` - Create new post
- `GET /api/posts/feed` - Get user feed
- `GET /api/posts/:postId` - Get specific post
- `POST /api/posts/:postId/like` - Like/unlike post
- `POST /api/posts/:postId/comment` - Add comment to post

### Messages
- `POST /api/messages/send` - Send message
- `GET /api/messages/conversations` - Get conversations
- `GET /api/messages/conversation/:userId` - Get conversation with user

### Endorsements
- `POST /api/endorse/` - Create endorsement (faculty only)
- `GET /api/endorse/student/:studentId` - Get student endorsements
- `GET /api/endorse/faculty/my` - Get faculty's endorsements

## 🧪 Testing

### Manual Testing
1. Visit `http://localhost:3000`
2. Register with a `.edu` email address
3. Test login/logout functionality
4. Create posts and interact with content
5. Test messaging between users

### Database Testing
- Check Supabase dashboard for data integrity
- Verify RLS policies are working
- Monitor performance with query analyzer
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

