# Auth-System 🔐

A full-stack authentication system built with **Node.js, Express, TypeScript, and PostgreSQL**, featuring secure password hashing, server-side sessions, and a responsive user interface.

## ✨ Features

- User registration and login
- Password hashing with bcrypt
- PostgreSQL database integration
- Session-based authentication
- Protected dashboard and user profile
- Logout and session destruction
- Login and signup rate limiting
- Input validation and duplicate-email handling
- Responsive login and registration UI

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| HTML, CSS, JavaScript | Frontend |
| Node.js | Runtime |
| Express.js | Backend framework |
| TypeScript | Type-safe backend development |
| PostgreSQL | Database |
| bcrypt | Password hashing |
| express-session | Session management |
| connect-pg-simple | PostgreSQL session storage |
| Helmet | HTTP security headers |
| express-rate-limit | Request rate limiting |

## 📁 Project Structure

```text
Auth-System/
├── frontend/
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   ├── dashboard.html
│   ├── dashboard.css
│   └── dashboard.js
├── src/
│   ├── db/
│   ├── middleware/
│   ├── routes/
│   └── server.ts
├── .gitignore
├── package.json
├── package-lock.json
└── tsconfig.json
```

## ⚙️ Getting Started

### Prerequisites

- Node.js and npm
- PostgreSQL
- Git

### 1. Clone the repository

```bash
git clone https://github.com/bindu-yogesh/Auth-System.git
cd Auth-System
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/uptoskills_auth
SESSION_SECRET=YOUR_RANDOM_SECRET
```

Replace the database credentials and generate a new random session secret. Never commit `.env` or expose its contents.

### 4. Create the database

Create a PostgreSQL database named `uptoskills_auth`, then run the SQL schema from your project setup to create the `users` table and its email index.

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register a user |
| POST | `/api/auth/login` | Authenticate a user |
| GET | `/api/auth/me` | Retrieve the authenticated user's profile |
| POST | `/api/auth/logout` | End the current session |
| GET | `/api/health` | Check server health |
| GET | `/api/health/db` | Check database connectivity |

## 🧪 Validation

Run the TypeScript checks and production build:

```bash
npm run typecheck
npm run build
```

## 🔒 Security

- Passwords are hashed using bcrypt.
- Authentication uses server-side sessions.
- Session cookies use `HttpOnly` and `SameSite` settings.
- Login and signup endpoints use rate limiting.
- Helmet adds HTTP security headers.
- Environment variables are used for sensitive configuration.

**Note:** Production deployment requires HTTPS, appropriate proxy and cookie configuration, and a security review.

## 👩‍💻 Author

**Bindu Yogesh**

- GitHub: [@bindu-yogesh](https://github.com/bindu-yogesh)

---

Built as a full-stack authentication project to practice backend development, database integration, and web application security.
