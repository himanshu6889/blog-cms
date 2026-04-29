import { createBrowserRouter } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import AdminLayout from "./layouts/AdminLayout";

import Home from "./pages/public/Home";
import BlogDetails from "./pages/public/BlogDetails";

import Dashboard from "./pages/admin/Dashboard";
import CreatePost from "./pages/admin/CreatePost";
import Posts from "./pages/admin/Posts";
import EditPost from "./pages/admin/EditPost";
import Drafts from "./pages/admin/Drafts";

import Login from "./pages/admin/Login";
import ForgotPassword from "./pages/admin/ForgotPassword";

import AuthRedirect from "./components/AuthRedirect";
import ProtectedRoute from "./components/ProtectedRoute";

import Signup from "./pages/admin/Signup";

import Profile from "./pages/admin/Profile";

const router = createBrowserRouter([
  /* PUBLIC WEBSITE */
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Home />
      },
      {
        path: "blog/:slug",
        element: <BlogDetails />
      }
    ]
  },

  /*  AUTH */
  {
    path: "/login",
    element: <Login />
  },
  {
    path: "/signup",
    element: <Signup />
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />
  },

  /*  ADMIN */
  {
    path: "/admin",
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Dashboard />
      },
      {
        path: "create-post",
        element: <CreatePost />
      },
      {
        path: "posts",
        element: <Posts />
      },
      {
        path: "edit-post/:slug",
        element: <EditPost />
      },
      {
        path: "drafts",               // 👈 NEW
        element: <Drafts />
      },
      {
        path: "profile",
        element: <Profile />
      }
    ]
  },

  /* 404 */
  {
    path: "*",
    element: (
      <div className="min-h-screen flex items-center justify-center text-4xl font-bold text-slate-700">
        404 Page Not Found
      </div>
    )
  }
]);

export default router;
