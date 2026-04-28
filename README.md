
# 📝 Blog CMS (Full Stack)

A modern full-stack Blog Content Management System built with  **React, Node.js, Express, and PostgreSQL** .

This project has evolved into a **feature-rich CMS** with authentication, admin dashboard, post management, and a public blog website.

---

# 🚀 Current Project Status (UPDATED)

| Feature                      | Status      |
| ---------------------------- | ----------- |
| Authentication (JWT)         | ✅ Complete |
| Admin Dashboard              | ✅ Complete |
| Create / Edit / Delete Posts | ✅ Complete |
| Public Blog Website          | ✅ Complete |
| Profile System + Avatar      | ✅ Complete |
| Sidebar Navigation           | ✅ Complete |
| Author System (NEW)          | ✅ Complete |
| Author Display (Home + Blog) | ✅ Complete |
| Route Highlight Fix          | ✅ Complete |
| UI Improvements              | ✅ Complete |

---

# 🆕 Latest Fixes (This Session)

## ✅ 1. Author Not Showing (FIXED)

### Problem:

* Posts did not show author name

### Solution:

* Added `user_id` in posts table
* Joined users table in backend

```sql
SELECT posts.*, users.name AS author_name, users.avatar AS author_avatar
FROM posts
LEFT JOIN users ON posts.user_id = users.id
```

---

## ✅ 2. Author Display in UI (FIXED)

### Updated:

* `Home.jsx` → shows author in cards
* `BlogDetails.jsx` → shows author below date

### Result:

* 👤 Author name visible
* 🔤 Avatar fallback (first letter)

---

## ✅ 3. Blog Page Missing Author (FIXED)

### Problem:

* Blog page (`/blog/:slug`) didn’t show author

### Fix:

* Updated `getPostBySlug` API with JOIN
* Added author UI in BlogDetails page

---

## ✅ 4. Sidebar "View Website" Not Highlighting (FIXED)

### Problem:

* Used `button` instead of `NavLink`

### Fix:

* Replaced with:

```jsx
<SidebarItem to="/" ... />
```

* Added support for:

```js
location.pathname.startsWith("/blog")
```

### Result:

* Sidebar now highlights correctly on:
  * `/`
  * `/blog/:slug`

---

## ✅ 5. Layout Improvements

* Author aligned properly
* Clean card structure
* Better spacing and UX

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
* Multer (file uploads)

---

# 📂 Project Structure

```
blog-cms/
│
├── frontend/
│   ├── pages/
│   │   ├── public/
│   │   │   ├── Home.jsx
│   │   │   └── BlogDetails.jsx
│   │   └── admin/
│   ├── components/
│   │   └── Sidebar.jsx
│
├── backend/
│   ├── controllers/
│   │   └── postController.js
│   ├── routes/
│   └── db.js
│
└── uploads/
```

---

# 🔐 Authentication System

* JWT-based login/signup
* Token stored in localStorage
* Protected admin routes

---

# 📰 Posts System

## Features:

* Create post
* Edit post
* Delete post
* View posts (admin)
* Public blog view

## New Enhancement:

* Author linked to each post

---

# 👤 Author System (NEW FEATURE)

## Features:

* Each post linked to user
* Displays:
  * Author name
  * Avatar (or fallback letter)

## Used in:

* Home page ✅
* Blog details page ✅

---

# 🎯 Routing

## Public

* `/` → Home
* `/blog/:slug` → Blog details

## Admin

* `/admin`
* `/admin/posts`
* `/admin/create-post`

---

# 🧠 Key Learnings

* Importance of **JOIN in relational DB**
* Difference between:
  * `Link` vs `NavLink`
* UI must match backend data
* Route-based UI state (sidebar highlighting)

---

# ⚠️ Known Limitations

* No pagination
* No comments system
* No author profile page yet
* Local file storage only

---

# 🚀 Future Improvements

* 👤 Author profile page (`/author/:id`)
* 📝 Comments system
* ☁️ Cloud storage (Cloudinary / S3)
* 🔎 Advanced search
* 📄 Pagination

---

# 🧪 How to Run

## Backend

```bash
cd backend
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

# 🎉 Final Summary

This project has evolved into a **fully functional CMS** with:

* Real authentication
* Admin dashboard
* Public blog system
* Author integration
* Clean UI/UX
* Proper routing system

---

# 👨‍💻 Author

Built as a **full-stack learning project** focusing on real-world architecture and features.

---
