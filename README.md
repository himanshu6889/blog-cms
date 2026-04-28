
# 📝 Blog CMS (Full Stack)

A modern full-stack Blog Content Management System built with  **React, Node.js, Express, and PostgreSQL** .
It allows users to create, manage, and view blog posts with authentication and a responsive admin dashboard.

---

# 🚀 Project Overview

This project is a **developer-focused CMS** with:

* Public blog website
* Admin dashboard
* Authentication system
* Profile management with avatar upload
* Post creation & management

---

# 🏗 Tech Stack

## Frontend

* React (Vite)
* React Router
* Tailwind CSS
* React Icons

## Backend

* Node.js
* Express.js
* PostgreSQL

## Other

* JWT Authentication
* Multer (for local image uploads)
* REST API

---

# 📂 Project Structure

```
blog-cms/
│
├── frontend/
│   ├── pages/
│   │   ├── public/        # Home, BlogDetails
│   │   └── admin/         # Dashboard, Posts, Profile, CreatePost
│   ├── components/        # Sidebar, ProfileMenu, etc.
│   ├── layouts/           # MainLayout, AdminLayout
│   └── routes.jsx
│
├── backend/
│   ├── routes/            # posts, users, upload
│   ├── controllers/
│   ├── db.js
│   └── server.js
│
└── uploads/               # Stored images (avatars)
```

---

# 🔐 Authentication System

* Signup & Login with JWT
* Protected admin routes using `ProtectedRoute`
* Token stored in `localStorage`
* Auto redirect if not authenticated

---

# 👤 Profile System (NEW FEATURE)

## Features Implemented

* Fetch logged-in user data
* Update name, bio, avatar
* Upload avatar from system (local upload)
* Remove avatar option
* Fallback avatar (first letter of name)
* Real-time navbar update (no refresh)

## Avatar Logic

* If avatar exists → show image
* If removed → show first letter
* Stored in backend via `/api/upload`

---

# 📰 Posts Management

## Features

* View all posts
* Search posts
* Sort (Newest, Oldest, A-Z)
* Select multiple posts
* Bulk delete
* Single delete
* Edit post
* View post
* Category grouping
* Stats dashboard (Total, Today, Categories)

## UI Highlights

* Table layout
* Hover actions
* Toast notifications
* Delete confirmation modal

---

# 🎨 UI / UX Features

* Dark / Light mode toggle
* Responsive sidebar (expand/collapse)
* Animated dropdown menu
* Clean modern dashboard design
* Avatar preview + fallback
* Smooth transitions

---

# 🔄 Routing System

## Public Routes

* `/` → Home
* `/blog/:slug` → Blog Details

## Auth Routes

* `/login`
* `/signup`
* `/forgot-password`

## Admin Routes

* `/admin` → Dashboard
* `/admin/create-post`
* `/admin/posts`
* `/admin/edit-post/:slug`
* `/admin/profile`

---

# 📦 API Endpoints

## Users

* `GET /api/users/me`
* `PUT /api/users/me`

## Posts

* `GET /api/posts`
* `POST /api/posts`
* `DELETE /api/posts/:id`

## Upload

* `POST /api/upload` → Upload avatar (Multer)

---

# 🖼 File Upload System

* Uses **Multer**
* Stores images in `/uploads`
* Served via:

```
http://localhost:5000/uploads/<filename>
```

---

# 🧠 Key Problems Solved

### ✔ Routing Issues

* Fixed wrong component rendering (Posts vs Profile)

### ✔ Theme Issues

* Replaced hardcoded colors with `dark:` classes

### ✔ Dropdown UX

* Close on click + outside click detection

### ✔ Navbar Sync

* Real-time profile update using custom event system

### ✔ Avatar Handling

* Upload + remove + fallback logic

### ✔ Data Safety

* Ensured array checks before rendering posts

---

# ⚠️ Known Limitations

* No pagination (all posts load at once)
* No image compression
* No role-based access (admin only assumed)
* Local file storage (not scalable for production)

---

# 🚀 Future Improvements

* Pagination & infinite scroll
* Cloud storage (Cloudinary / S3)
* Drag & drop upload
* Cover image for profile
* Comments system
* Post drafts & publishing workflow
* Rich text editor
* Notifications system

---

# 🧪 How to Run

## Backend

```bash
cd backend

```

## Hasura

Hasura runs alongside the app stack and connects to the same Postgres database.

* Console: `http://localhost:8080`
* Admin secret: `hasuraadminsecret`
* It can be used to track tables, explore data, and manage schema metadata.
npm install
npm run dev
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

---

# ✅ Current Status

| Feature        | Status      |
| -------------- | ----------- |
| Authentication | ✅ Complete |
| Dashboard UI   | ✅ Complete |
| Create Post    | ✅ Complete |
| Manage Posts   | ✅ Complete |
| Edit Post      | ✅ Complete |
| Profile System | ✅ Complete |
| Avatar Upload  | ✅ Complete |
| Theme Toggle   | ✅ Complete |
| Navbar Sync    | ✅ Complete |

---

# 👨‍💻 Author

Developed as part of a full-stack learning project.
Focused on building a  **real-world CMS with production-like features** .

---

# ⭐ Final Note

This project has evolved from a basic CRUD app into a  **fully functional CMS with advanced UI and real-time features** .

---
