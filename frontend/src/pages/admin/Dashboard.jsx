import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaPlus,
  FaFileAlt,
  FaGlobe,
  FaChartLine
} from "react-icons/fa";

import API_BASE from "../../api";

export default function Dashboard() {

  const [posts, setPosts] = useState([]);
  
  useEffect(() => {
  fetch(`${API_BASE}/api/posts`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  })
    .then((res) => res.json())
    .then((data) => {
      console.log("API Response:", data); // debug

      //  Ensure it's always an array
      if (Array.isArray(data)) {
        setPosts(data);
      } else {
        setPosts([]); // fallback
      }
    })
    .catch((err) => console.error(err));
  }, []);

  const categories = [
    ...new Set(
      posts.map((post) =>
        (post.category?.trim() || "General").toLowerCase()
      )
    )
  ];

  const recentPosts = [...posts].reverse().slice(0, 5);

  const currentDate  = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear  = currentDate.getFullYear();

  const thisMonthPosts = posts.filter((post) => {
    const d = new Date(post.created_at);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

  const drafts = 0;

  const [postCount,     setPostCount]     = useState(0);
  const [categoryCount, setCategoryCount] = useState(0);
  const [monthCount,    setMonthCount]    = useState(0);
  const [draftCount,    setDraftCount]    = useState(0);

  useEffect(() => {
    if (posts.length > 0) {
      animateCounter(posts.length, setPostCount);
      animateCounter(categories.length, setCategoryCount);
      animateCounter(thisMonthPosts, setMonthCount);
      animateCounter(drafts, setDraftCount);
    }
  }, [posts]);

  const animateCounter = (target, setter) => {
    let current = 0;
    const step  = Math.max(1, Math.ceil(target / 30));
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { setter(target); clearInterval(timer); }
      else setter(current);
    }, 25);
  };

  const formatDate = (value) => {
    const date = new Date(value);
    if (isNaN(date)) return "";
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    });
  };

  const chartHeight = (value) => {
    if (value === 0) return "0%";
    const max = Math.max(posts.length, categories.length, thisMonthPosts, 1);
    return `${(value / max) * 100}%`;
  };

  return (
    <div className="space-y-8">

      {/* PAGE HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div>
          <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
            Manage your content and monitor publishing activity
          </p>
        </div>
        <Link
          to="/admin/create-post"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-2xl font-semibold shadow-lg hover:shadow-2xl hover:-translate-y-0.5 transition-all"
        >
          <FaPlus />
          Create Post
        </Link>
      </div>

      {/* STAT CARDS */}
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard title="Total Posts"  value={postCount}     sub="Published posts"      color="from-blue-600 to-indigo-600"   border="from-blue-500 to-indigo-500" />
        <StatCard title="Categories"   value={categoryCount} sub="Used categories"       color="from-green-500 to-emerald-600" border="from-green-500 to-emerald-600" />
        <StatCard title="This Month"   value={monthCount}    sub="Published this month"  color="from-purple-500 to-pink-500"   border="from-purple-500 to-pink-500" />
        <StatCard title="Drafts"       value={draftCount}    sub="Saved drafts"          color="from-orange-400 to-amber-500"  border="from-orange-400 to-amber-500" />
      </div>

      {/* RECENT POSTS + ANALYTICS */}
      <div className="grid xl:grid-cols-3 gap-6">

        {/* Recent Posts */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Recent Posts
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Latest published posts
              </p>
            </div>
            <Link to="/admin/posts" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
              View All
            </Link>
          </div>

          {recentPosts.length === 0 ? (
            <div className="text-center py-16 text-slate-400 dark:text-slate-500">
              No posts available.
            </div>
          ) : (
            <div className="space-y-4">
              {recentPosts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 dark:border-slate-700 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/60 hover:border-blue-200 dark:hover:border-blue-700 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 text-slate-600 dark:text-slate-300 font-bold flex items-center justify-center uppercase">
                      {post.title?.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {post.title}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {formatDate(post.created_at)}
                      </p>
                    </div>
                  </div>
                  <Link to={`/blog/${post.slug}`} className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
                    View
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">

          {/* Analytics */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <FaChartLine className="text-blue-600 dark:text-blue-400" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Analytics
              </h2>
            </div>
            <div className="h-60 flex items-end justify-between gap-4">
              <Bar label="Posts"      value={posts.length}      height={chartHeight(posts.length)}      color="from-blue-500 to-indigo-500" />
              <Bar label="Categories" value={categories.length} height={chartHeight(categories.length)} color="from-green-500 to-emerald-500" />
              <Bar label="Month"      value={thisMonthPosts}    height={chartHeight(thisMonthPosts)}    color="from-purple-500 to-pink-500" />
              <Bar label="Drafts"     value={drafts}            height={chartHeight(drafts)}            color="from-orange-400 to-amber-500" />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-5">
              Quick Actions
            </h2>
            <div className="space-y-4">
              <Link
                to="/admin/create-post"
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl font-semibold transition"
              >
                <FaPlus />
                Create New Post
              </Link>
              <Link
                to="/admin/posts"
                className="flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 py-3 rounded-2xl font-semibold transition"
              >
                <FaFileAlt />
                Manage Posts
              </Link>
              <Link
                to="/"
                className="flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 py-3 rounded-2xl font-semibold transition"
              >
                <FaGlobe />
                View Website
              </Link>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}

function StatCard({ title, value, sub, color, border }) {
  return (
    <div className="relative overflow-hidden bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${border}`} />
      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
        {title}
      </p>
      <h2 className={`text-6xl font-black mt-5 bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
        {value}
      </h2>
      <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">{sub}</p>
    </div>
  );
}

function Bar({ label, value, height, color }) {
  return (
    <div className="w-full flex flex-col items-center gap-2">
      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
        {value}
      </span>
      <div className="w-full h-40 bg-slate-100 dark:bg-slate-700 rounded-2xl overflow-hidden flex items-end">
        <div
          className={`w-full bg-gradient-to-t ${color} rounded-2xl shadow-sm transition-all duration-1000 ease-out`}
          style={{ height }}
        />
      </div>
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 text-center">
        {label}
      </p>
    </div>
  );
}
