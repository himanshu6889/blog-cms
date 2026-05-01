
# 📝 Blog CMS (Full Stack)

A modern full-stack Blog Content Management System built with  **React, Node.js, Express, and PostgreSQL** .

This project has evolved into a **feature-rich CMS** with authentication, admin dashboard, post management, and a public blog website.

---

# 🚀 Current Project Status (UPDATED: May 2026)

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
| Rich Text Editor (Lexical)   | ✅ Complete |
| Image Upload & Cropping      | ✅ Complete |
| Draft System                 | ✅ Complete |
| Categories & Search          | ✅ Complete |
| CSRF Protection              | ✅ Complete |
| Docker Containerization      | ✅ Complete |
| Theme Toggle (Dark/Light)    | ✅ Complete |
| Responsive Design            | ✅ Complete |

---

# 🏗️ Architecture

## Backend
- **Node.js + Express** - REST API server
- **PostgreSQL** - Database with Hasura GraphQL
- **JWT Authentication** - Secure user sessions
- **Multer** - File upload handling
- **bcrypt** - Password hashing
- **CSRF Protection** - Security middleware

## Frontend
- **React 19** - Modern UI framework
- **Vite** - Fast build tool
- **TailwindCSS** - Utility-first styling
- **Lexical** - Rich text editor
- **React Router** - Client-side routing
- **React Icons** - Icon library

## Infrastructure
- **Docker Compose** - Container orchestration
- **PostgreSQL 15** - Primary database
- **Hasura** - GraphQL engine
- **Vercel/Netlify** - Deployment ready

---

# 🎯 Key Features

## 🔐 Authentication & Security
- User registration and login
- JWT-based authentication
- CSRF token protection
- Secure password hashing
- Session management

## 📝 Content Management
- Rich text editor with Lexical
- Image upload with cropping
- Thumbnail generation
- Draft saving
- Post categories and tags
- SEO-friendly slugs

## 👤 User Profiles
- Avatar upload
- Bio and profile information
- Author pages
- Profile editing

## 🌐 Public Website
- Responsive blog layout
- Category filtering
- Search functionality
- Author attribution
- Reading time estimates
- Dark/light theme toggle

## 🛠️ Admin Dashboard
- Post management (CRUD)
- Draft management
- User profile management
- Content analytics

---

# 🚀 Getting Started

## Prerequisites
- Docker and Docker Compose
- Node.js 18+
- npm or yarn

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd blog-cms
   ```

2. **Start the services**
   ```bash
   docker-compose up -d
   ```

3. **Install dependencies**
   ```bash
   # Backend
   cd backend
   npm install

   # Frontend
   cd ../frontend
   npm install
   ```

4. **Setup database**
   ```bash
   # Run the SQL setup script
   docker exec -i blog-postgres psql -U postgres -d blogcms < backend/sql_queries/first.sql
   ```

5. **Start development servers**
   ```bash
   # Backend (from backend directory)
   npm run dev

   # Frontend (from frontend directory)
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000
   - Hasura Console: http://localhost:8080

---

# 📁 Project Structure

```
blog-cms/
├── backend/
│   ├── controllers/     # Route handlers
│   ├── middleware/      # Auth, CSRF, validation
│   ├── routes/          # API endpoints
│   ├── sql_queries/     # Database setup
│   ├── uploads/         # File storage
│   └── utils/           # Helper functions
├── frontend/
│   ├── public/          # Static assets
│   ├── src/
│   │   ├── api.js       # API configuration
│   │   ├── components/  # Reusable UI components
│   │   ├── editor/      # Rich text editor
│   │   ├── layouts/     # Page layouts
│   │   ├── pages/       # Route components
│   │   └── utils/       # Frontend utilities
│   └── vercel.json      # Deployment config
└── docker-compose.yml   # Container setup
```

---

# 🔧 API Endpoints

## Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

## Posts
- `GET /api/posts/public` - Get public posts
- `GET /api/posts/:slug` - Get post by slug
- `POST /api/posts` - Create post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post

## Users
- `GET /api/users/me` - Get user profile
- `PUT /api/users/me` - Update profile

## Upload
- `POST /api/upload` - Upload files

---

# 🎨 UI Components

## Rich Text Editor
- Lexical-based WYSIWYG editor
- Image insertion
- Lists and formatting
- Markdown shortcuts

## Image Management
- Drag & drop upload
- Thumbnail cropping
- Automatic resizing
- File validation

## Responsive Design
- Mobile-first approach
- TailwindCSS styling
- Dark/light theme support
- Accessible components

---

# 🔒 Security Features

- **JWT Authentication** - Stateless token-based auth
- **CSRF Protection** - Cross-site request forgery prevention
- **Input Sanitization** - DOMPurify for HTML content
- **Password Hashing** - bcrypt with salt rounds
- **CORS Configuration** - Proper origin validation
- **File Upload Security** - Type and size validation

---

# 🚀 Deployment

## Vercel (Frontend)
```bash
npm run build
# Deploy to Vercel with vercel.json config
```

## Netlify (Frontend)
```bash
npm run build
# Deploy with _redirects for SPA routing
```

## Docker (Full Stack)
```bash
docker-compose up -d
# Includes PostgreSQL, Hasura, and Node.js services
```

---

# 🆕 Recent Updates

## ✅ Latest Features Added
- **Rich Text Editor**: Full Lexical integration with toolbar
- **Image Cropping**: Advanced thumbnail cropping interface
- **Author System**: Complete author profiles and attribution
- **Draft Management**: Auto-save and draft restoration
- **Theme Toggle**: Dark/light mode with persistence
- **CSRF Protection**: Enhanced security middleware
- **Docker Setup**: Complete containerization with Hasura

## 🔧 Technical Improvements
- **Performance**: Optimized queries with proper indexing
- **UX**: Improved loading states and error handling
- **SEO**: Meta tags and structured data
- **Accessibility**: ARIA labels and keyboard navigation
- **Mobile**: Responsive design across all devices

---

# 📈 Future Roadmap

- [ ] Comment system
- [ ] Social sharing
- [ ] Analytics dashboard
- [ ] Multi-language support
- [ ] API documentation
- [ ] Email notifications
- [ ] Backup system

---

# 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

# 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

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
