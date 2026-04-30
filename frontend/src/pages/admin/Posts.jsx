  // import { useMemo, useState } from "react";
  import { useMemo, useState, useEffect } from "react";
  import { Link } from "react-router-dom";
  import {
    FaSearch, FaTrash, FaPlus, FaCheckCircle,
    FaFileAlt, FaLayerGroup, FaCalendarAlt, FaEye, FaPen
  } from "react-icons/fa";

  import API_BASE from "../../api"; 

  export default function Posts() {
    const [posts, setPosts] = useState([]);
    const safePosts = Array.isArray(posts) ? posts : [];
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState([]);
    const [sortBy, setSortBy] = useState("newest");
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteIds, setDeleteIds] = useState([]);
    const [showToast, setShowToast] = useState(false);

    useEffect(() => {
      const fetchPosts = async () => {
        try {
          const res = await fetch(`${API_BASE}/api/posts`, {
            credentials: "include",
          });
          const data = await res.json();
          if (Array.isArray(data)) {
            setPosts(data.filter((p) => p.status === "published"));
          } else {
            setPosts([]);
          }

          console.log("Posts API:", data); // Debug log
        } catch (err) {
          console.error("Error fetching posts:", err);
          setPosts([]);
        }
      };

      fetchPosts();
    }, []);



    const formatDateParts = (value) => {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return { date: "-", time: "-" };

      return {
        date: date.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          timeZone: "Asia/Kolkata",
        }),
        time: date.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
          timeZone: "Asia/Kolkata",
        }),
      };
    };

    const formatDate = (value) => formatDateParts(value).date;

    const formatTime = (value) => formatDateParts(value).time;

    const uniqueCategories = [
  ...new Set(
    safePosts.map((post) =>
      (post.category || "General").toLowerCase()
    )
  )
];

    const todayCount = safePosts.filter((post) => {
      const d = new Date(post.created_at);
      const t = new Date();
      return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
    }).length;

    const filteredPosts = useMemo(() => {
      let data = safePosts.filter((post) => post.title?.toLowerCase().includes(search.toLowerCase()));
      switch (sortBy) {
        case "oldest": data.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()); break;
        case "az": data.sort((a, b) => a.title.localeCompare(b.title)); break;
        case "za": data.sort((a, b) => b.title.localeCompare(a.title)); break;
        default: data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }
      return data;
    }, [safePosts, search, sortBy]);

    const toggleSelect = (id) => setSelected((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);
    const selectAll = () => {
      if (selected.length === filteredPosts.length && filteredPosts.length > 0) setSelected([]);
      else setSelected(filteredPosts.map((post) => post.id));
    };
    const bulkDelete = () => { if (!selected.length) return; setDeleteIds(selected); setShowDeleteModal(true); };
    const singleDelete = (id) => { setDeleteIds([id]); setShowDeleteModal(true); };
  

    const confirmDelete = async () => {
    try {
      // delete from backend
      for (let id of deleteIds) {
        await fetch(`${API_BASE}/api/posts/${id}`, {
          method: "DELETE",
          credentials: "include",
        });
      }

      // refetch updated posts
      const res = await fetch(`${API_BASE}/api/posts`, {
        credentials: "include",
      });
      
      const data = await res.json();

      setPosts(data);
      setSelected([]);
      setDeleteIds([]);
      setShowDeleteModal(false);

      setShowToast(true);
      setTimeout(() => setShowToast(false), 1800);
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

    return (
      <div className="space-y-7">

        {/* Toast */}
        {showToast && (
          <div className="fixed top-6 right-6 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl px-5 py-4 min-w-[280px]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center">
                <FaCheckCircle />
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Deleted Successfully</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Posts updated.</p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-5">
          <div>
            <h1 className="text-5xl font-black text-slate-900 dark:text-white">Manage Posts</h1>
            <p className="text-slate-500 dark:text-slate-400 text-lg mt-2">Review, sort and manage all published content.</p>
          </div>
          <Link
            to="/admin/create-post"
            className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-blue-600 text-white font-semibold shadow-lg hover:bg-blue-700 transition"
          >
            <FaPlus /> Create Post
          </Link>
        </div>

        {/* Stat cards */}
        <div className="grid md:grid-cols-4 gap-4">
          <StatCard title="Total Posts" value={safePosts.length} icon={<FaFileAlt />} color="blue" />
          <StatCard title="Published Today" value={todayCount} icon={<FaCalendarAlt />} color="violet" />
          <StatCard title="Categories" value={uniqueCategories.length} icon={<FaLayerGroup />} color="green" />
          <StatCard title="Selected" value={selected.length} icon={<FaCheckCircle />} color="blue" />
        </div>

        {/* Filters bar */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search posts..."
              className="w-full pl-11 pr-4 h-12 rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={sortBy} onChange={(e) => setSortBy(e.target.value)}
              className="h-12 px-4 rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="az">Title A-Z</option>
              <option value="za">Title Z-A</option>
            </select>
            <button
              onClick={bulkDelete} disabled={!selected.length}
              className="h-12 px-5 rounded-2xl bg-red-500 text-white font-semibold hover:bg-red-600 transition disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:text-slate-400 dark:disabled:text-slate-500"
            >
              Delete Selected
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
          <div className="h-[3px] bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500" />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                <tr className="h-[60px] text-[12px] uppercase tracking-[0.14em] text-slate-600 dark:text-slate-400 font-bold">
                  <th className="w-[52px] text-center pl-4">
                    <input
                      type="checkbox"
                      checked={filteredPosts.length > 0 && selected.length === filteredPosts.length}
                      onChange={selectAll}
                      className="accent-blue-600 scale-110"
                    />
                  </th>
                  <th className="px-4 text-left">Post</th>
                  <th className="w-[150px] px-4 text-left">Category</th>
                  <th className="w-[160px] px-4 text-left">Published</th>
                  <th className="w-[240px] px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPosts.map((post) => (
                  <tr key={post.id} className="group border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                    <td className="text-center py-4 pl-4">
                      <input
                        type="checkbox"
                        checked={selected.includes(post.id)}
                        onChange={() => toggleSelect(post.id)}
                        className="accent-blue-600 scale-110"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 overflow-hidden flex-shrink-0">
                          {post.thumbnail ? (
                            <img src={post.thumbnail} alt="" className="w-full h-full object-cover" />
                          ) : (
                            post.title?.charAt(0)?.toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-[15px] text-slate-900 dark:text-white truncate max-w-[280px]">{post.title}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">/blog/{post.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[12px] font-bold uppercase tracking-wide">
                        {post.category || "General"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-semibold text-sm text-slate-900 dark:text-white">{formatDate(post.created_at)}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{formatTime(post.created_at)}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <Link
                          to={`/blog/${post.slug}`}
                          className="h-9 px-4 rounded-xl bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-slate-300 dark:hover:bg-slate-500 transition"
                        >
                          <FaEye size={11} /> View
                        </Link>
                        <Link
                          to={`/admin/edit-post/${post.slug}`}
                          className="h-9 px-4 rounded-xl bg-blue-600 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-blue-700 transition"
                        >
                          <FaPen size={11} /> Edit
                        </Link>
                        <button
                          onClick={() => singleDelete(post.id)}
                          className="h-9 px-4 rounded-xl bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredPosts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-20 text-center text-slate-400 dark:text-slate-500 text-lg">
                      No posts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Delete Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4">
            <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl p-8">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 flex items-center justify-center mx-auto mb-5 text-xl">
                <FaTrash />
              </div>
              <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-white">Delete Post?</h2>
              <p className="text-center text-slate-500 dark:text-slate-400 mt-2 mb-7">This action cannot be undone.</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="h-12 rounded-2xl border border-slate-300 dark:border-slate-600 font-semibold text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="h-12 rounded-2xl bg-red-500 text-white font-semibold hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  function StatCard({ title, value, icon, color }) {
    const styles = {
      blue: "text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400",
      green: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400",
      violet: "text-violet-600 bg-violet-50 dark:bg-violet-900/30 dark:text-violet-400",
    };
    return (
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm px-6 py-5 min-h-[118px]">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</p>
            <h3 className="text-5xl font-black text-slate-900 dark:text-white mt-3">{value}</h3>
          </div>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg ${styles[color]}`}>
            {icon}
          </div>
        </div>
      </div>
    );
  }