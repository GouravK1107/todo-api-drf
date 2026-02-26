# Django Todo REST API – Full-Stack Task Management System

A production-ready Task Management Web Application built with Django and Django REST Framework featuring authentication, email verification, password reset via OTP, real-time notifications, dashboard analytics, and a fully functional REST API.

This is not a basic CRUD demo — this is a structured, multi-app, feature-complete backend system.

---

## 🚀 Core Features

### 🔐 1. User Authentication System
- Custom `AppUser` model (Email as primary identifier)
- Secure password hashing (`make_password` / `check_password`)
- Session-based authentication
- Login / Signup UI
- Logout functionality
- Active session management
- Session expiry (2 weeks)

---

### 📧 2. Email Verification Flow
- Email validation during signup
- 6-digit OTP generation
- OTP expiry (5 minutes)
- Resend OTP functionality
- HTML-based email templates
- `PendingUser` model for temporary signup storage
- Complete signup only after verification

---

### 🔑 3. Password Reset System
- Forgot password flow
- OTP-based reset (10-minute expiry)
- Password strength validation
- Reset confirmation email
- Secure token validation

---

### 📋 4. Task Management Dashboard

#### Task CRUD
- Create, update, delete tasks
- Mark complete/incomplete
- Mark important/unimportant
- Set priority (High / Medium / Low)
- Assign project category (Work / Personal / Health)
- Due date support

#### Filtering & Sorting
- Filter by:
  - Status
  - Priority
  - Project
- Search (title / description)
- Sort by:
  - Due date
  - Priority
  - Title

#### Visual Indicators
- 🔴 High Priority
- 🟡 Medium Priority
- 🟢 Low Priority
- Overdue highlighting
- Important task star
- Grid/List view toggle

---

### 📊 5. Dashboard Statistics
- Weekly progress tracking
- Completion percentage
- Completed vs Total tasks
- Overdue count
- Important count
- Project-wise statistics

---

### 🔔 6. Notification System
- Bell icon with unread badge
- Slide-out notification panel
- Mark as read
- Mark all as read
- Clear all notifications

#### Notification Types
- Task created
- Task updated
- Task deleted
- Task completed
- Task overdue
- Project assignment

---

### 🔔 7. Real-Time Toast Notifications
- ✅ Success (Green)
- 📝 Info (Blue)
- 🗑️ Error (Red)
- ⚠️ Warning (Amber)
- ⭐ Important (Yellow)

---

## 🧠 REST API Endpoints

### User Account APIs

```
POST   /useraccounts/api/user/login/
POST   /useraccounts/api/user/logout/
GET    /useraccounts/api/user/me/
GET    /useraccounts/api/auth/csrf/

POST   /useraccounts/api/auth/send-otp/
POST   /useraccounts/api/auth/verify-otp/
POST   /useraccounts/api/auth/resend-otp/
POST   /useraccounts/api/auth/complete-signup/

POST   /useraccounts/api/auth/forgot-password/send-otp/
POST   /useraccounts/api/auth/forgot-password/verify-otp/
POST   /useraccounts/api/auth/forgot-password/resend-otp/
POST   /useraccounts/api/auth/reset-password/
```

### Task & Notification APIs

```
GET    /tasko/api/tasks/
POST   /tasko/api/tasks/
GET    /tasko/api/tasks/<id>/
PUT    /tasko/api/tasks/<id>/
DELETE /tasko/api/tasks/<id>/

GET    /tasko/api/tasks/stats/
POST   /tasko/api/tasks/bulk_update/

GET    /tasko/api/notifications/
PATCH  /tasko/api/notifications/<id>/
POST   /tasko/api/notifications/mark_all_read/
DELETE /tasko/api/notifications/clear_all/

GET    /tasko/api/stats/
POST   /tasko/api/bulk-operations/
```

---

## 🗄 Database Models

- `AppUser` – Custom authentication model
- `PendingUser` – Temporary signup storage
- `PasswordReset` – OTP storage for password reset
- `Task` – Core task model
- `Notification` – User notification system

---

## 🎨 Frontend Features

- Fully responsive (Mobile / Tablet / Desktop)
- Dark / Light mode
- Smooth animations
- Toast notifications
- Modal-based task forms
- Sidebar filtering
- Debounced search
- Loading states

---

## 🛡 Security Features

- Session-based authentication
- CSRF protection
- Secure password hashing
- OTP expiry handling
- Password strength validation
- Secure session expiration

---

## 🛠 Tech Stack

- Python
- Django
- Django REST Framework
- SQLite (Development)
- HTML / CSS / JavaScript

---

## 📈 Project Status

Feature Complete  
Actively extendable  
Production-ready architecture  

---

## 👨‍💻 Author

Gourav Kumar, BCA Student.
- Interested in Backend + AI

---

## 📌 Future Improvements

- JWT authentication option
- Deployment (Render / AWS)
- PostgreSQL integration
- Docker support
- CI/CD pipeline
- API documentation (Swagger)

---

## 📄 License

This project is open for learning and portfolio demonstration purposes.