# 🎓 MyClassRoom.LK — Full Stack LMS

A complete Learning Management System built with **Node.js + Express + MySQL**, featuring a premium Liquid Glass UI with a red/black/white theme.

---

## 📁 Project Structure

```
myclassroom/
├── server.js              # Express entry point
├── package.json
├── .env.example           # Copy to .env and fill in values
├── database.sql           # MySQL schema + seed data
├── config/
│   └── db.js              # MySQL connection pool
├── middleware/
│   └── auth.js            # JWT authentication middleware
├── routes/
│   ├── auth.js            # Register / Login / Profile APIs
│   └── courses.js         # Courses & Enrollment APIs
└── public/
    ├── index.html          # Landing page
    ├── login.html          # Login page
    ├── register.html       # Registration page
    ├── dashboard.html      # Student dashboard
    ├── admin.html          # Admin panel
    ├── 404.html            # Error page
    ├── css/
    │   └── global.css      # Shared styles (Glassmorphism theme)
    └── js/
        └── global.js       # Shared JS (cursor, toast, API wrapper, auth)
```

---

## ⚡ Quick Start

### 1. Prerequisites
- Node.js v18+
- MySQL 8.0+

### 2. Clone & Install
```bash
cd myclassroom
npm install
```

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env with your MySQL credentials and a strong JWT_SECRET
```

### 4. Set Up Database
```bash
mysql -u root -p < database.sql
```
This creates the `myclassroom_lk` database with tables and seed data.

### 5. Run the Server
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

### 6. Open in Browser
```
http://localhost:3000
```

---

## 🔐 Demo Accounts

| Role    | Email                        | Password       |
|---------|------------------------------|----------------|
| Student | student@myclassroom.lk       | Student@1234   |
| Admin   | admin@myclassroom.lk         | Admin@1234     |

---

## 🛠 API Endpoints

### Authentication
| Method | Route                       | Auth     | Description            |
|--------|-----------------------------|----------|------------------------|
| POST   | `/api/auth/register`        | Public   | Create account         |
| POST   | `/api/auth/login`           | Public   | Login + get JWT        |
| POST   | `/api/auth/logout`          | Public   | Clear cookie           |
| GET    | `/api/auth/me`              | Required | Get current user       |
| PATCH  | `/api/auth/profile`         | Required | Update profile         |
| PATCH  | `/api/auth/change-password` | Required | Change password        |

### Courses
| Method | Route                          | Auth     | Description              |
|--------|--------------------------------|----------|--------------------------|
| GET    | `/api/courses`                 | Public   | List all courses         |
| GET    | `/api/courses/:id`             | Public   | Get single course        |
| POST   | `/api/courses`                 | Admin    | Create course            |
| PUT    | `/api/courses/:id`             | Admin    | Update course            |
| DELETE | `/api/courses/:id`             | Admin    | Delete course            |
| POST   | `/api/courses/:id/enroll`      | Student  | Enrol in course          |
| GET    | `/api/courses/enrolled/me`     | Student  | My enrollments           |
| PATCH  | `/api/courses/:id/progress`    | Student  | Update progress (0-100)  |
| GET    | `/api/courses/admin/stats`     | Admin    | Platform statistics      |

---

## 🗄 Database Schema

### `users`
| Column      | Type              | Notes              |
|-------------|-------------------|--------------------|
| id          | INT UNSIGNED PK   | Auto increment     |
| full_name   | VARCHAR(100)      |                    |
| email       | VARCHAR(150) UQ   |                    |
| password    | VARCHAR(255)      | bcrypt hashed      |
| role        | ENUM              | student / admin    |
| avatar      | VARCHAR(255)      | File path          |
| bio         | TEXT              |                    |
| is_verified | TINYINT(1)        |                    |
| created_at  | DATETIME          |                    |

### `courses`
| Column      | Type             | Notes              |
|-------------|------------------|--------------------|
| id          | INT UNSIGNED PK  |                    |
| title       | VARCHAR(200)     |                    |
| description | TEXT             |                    |
| instructor  | VARCHAR(100)     |                    |
| category    | VARCHAR(80)      |                    |
| level       | ENUM             | Beginner/Int/Adv   |
| duration    | VARCHAR(40)      | e.g. "12 hours"    |
| video_url   | VARCHAR(255)     |                    |
| price       | DECIMAL(8,2)     | 0.00 = free        |
| is_published| TINYINT(1)       |                    |

### `enrollments`
| Column      | Type            | Notes              |
|-------------|-----------------|---------------------|
| id          | INT UNSIGNED PK |                     |
| user_id     | FK → users      | CASCADE DELETE      |
| course_id   | FK → courses    | CASCADE DELETE      |
| progress    | TINYINT         | 0–100               |
| status      | ENUM            | active/completed/paused |
| enrolled_at | DATETIME        |                     |

---

## 🔒 Security Features

- ✅ Passwords hashed with **bcrypt** (12 salt rounds)
- ✅ **JWT** tokens (7-day expiry, HttpOnly cookies)
- ✅ **Prepared statements** via mysql2 (SQL injection prevention)
- ✅ **Input validation** with express-validator
- ✅ Admin role guard middleware
- ✅ CORS configured for production domain
- ✅ No plain-text passwords stored anywhere

---

## 🎨 UI Features

- Liquid Glassmorphism cards (`backdrop-filter: blur`)
- Animated red liquid gradient blobs
- Floating particle background
- Custom red cursor with trailing ring
- Smooth scroll reveal animations
- Password strength meter
- Button ripple effects on click
- Toast notification system
- Collapsible sidebar dashboard
- Fully responsive (mobile breakpoints)

---

## 🚀 Deployment (Shared Hosting / VPS)

1. Upload project to server
2. Set `NODE_ENV=production` in `.env`
3. Configure your real MySQL credentials
4. Use **PM2** for process management:
   ```bash
   npm install -g pm2
   pm2 start server.js --name myclassroom
   pm2 save
   ```
5. Set up **Nginx** reverse proxy to port 3000
6. Add SSL certificate (Let's Encrypt / Certbot)

---

## 📦 Tech Stack

| Layer    | Technology                        |
|----------|------------------------------------|
| Frontend | HTML5, CSS3 (Glassmorphism), JS ES6 |
| Backend  | Node.js 18, Express 4              |
| Database | MySQL 8 (mysql2/promise)           |
| Auth     | JWT (jsonwebtoken) + bcryptjs      |
| Validation | express-validator               |
| Fonts    | Syne + DM Sans (Google Fonts)      |
