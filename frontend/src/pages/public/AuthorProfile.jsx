import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import API_BASE from "../../api";

export default function AuthorProfile() {
  const { id } = useParams();

  const [author, setAuthor] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    const fetchAuthor = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/authors/${id}`);
        const data = await res.json();

        if (data.error) {
          setAuthor(null);
        } else {
          setAuthor(data.author);
          setPosts(data.posts);
        }
      } catch (err) {
        console.error("Error loading author:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAuthor();
  }, [id]);

  const formatCategory = (cat) => {
    if (!cat) return "General";
    return cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase();
  };

  const getRelativeTime = (value) => {
    const createdAt = new Date(value);
    const now = new Date();
    const diffMs = now - createdAt;
    if (Number.isNaN(createdAt.getTime()) || diffMs < 0) return "just now";
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
    const weeks = Math.floor(days / 7);
    return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  };

  const categoryColors = {
    Tech:     "bg-blue-50   dark:bg-blue-900/30   text-blue-600   dark:text-blue-400",
    Design:   "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
    Business: "bg-green-50  dark:bg-green-900/30  text-green-600  dark:text-green-400",
    General:  "bg-slate-100 dark:bg-slate-700     text-slate-600  dark:text-slate-300",
  };

  // Derive categories from posts
  const categories = [
    "All",
    ...new Set(posts.map((p) => formatCategory(p.category))),
  ];

  // Filter posts by search + category
  const filteredPosts = posts.filter((post) => {
    const matchSearch = (post.title || "")
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchCategory =
      activeCategory === "All" ||
      formatCategory(post.category) === activeCategory;
    return matchSearch && matchCategory;
  });

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <p className="text-slate-500 dark:text-slate-400 text-lg animate-pulse">
          Loading author...
        </p>
      </div>
    );
  }

  // ── Not Found ────────────────────────────────────────────────────────────
  if (!author) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <h1 className="text-4xl font-bold text-slate-700 dark:text-slate-300">
          Author Not Found
        </h1>
      </div>
    );
  }

  // ── Page ─────────────────────────────────────────────────────────────────
  return (
    <div className="w-full px-8 py-10">

      {/* Breadcrumb */}
      <div className="text-sm text-slate-500 dark:text-slate-400 mb-8">
        <Link to="/" className="hover:text-blue-600 dark:hover:text-blue-400">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-700 dark:text-slate-300 font-medium">
          {author.name}
        </span>
      </div>

      {/* Author Hero Card */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-xl p-8 mb-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
        {/* Avatar */}
        {author.avatar ? (
          <img
            src={author.avatar}
            alt={author.name}
            className="w-24 h-24 rounded-full object-cover flex-shrink-0 ring-4 ring-blue-100 dark:ring-blue-900/40"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-blue-600 text-white flex items-center justify-center text-4xl font-bold uppercase flex-shrink-0 ring-4 ring-blue-100 dark:ring-blue-900/40">
            {author.name?.charAt(0) || "?"}
          </div>
        )}

        {/* Info */}
        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            {author.name}
          </h1>
          {author.email && (
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
              {author.email}
            </p>
          )}
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-semibold">
            ✍️ {posts.length} {posts.length === 1 ? "Post" : "Posts"}
          </div>
        </div>
      </div>

      {/* Section Title */}
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
        Posts by {author.name}
      </h2>

      {/* Search */}
      <input
        type="text"
        placeholder={`Search ${author.name}'s posts...`}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full mb-6 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500 transition"
      />

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap mb-10">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              activeCategory === cat
                ? "bg-blue-600 text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Posts Grid */}
      {filteredPosts.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-8">
          {filteredPosts.map((post) => (
            <Link key={post.id} to={`/blog/${post.slug}`} className="group block">
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden hover:shadow-lg dark:hover:shadow-slate-900 hover:-translate-y-1 transition h-full flex flex-col">

                {post.thumbnail ? (
                  <img
                    src={post.thumbnail}
                    alt={post.title}
                    className="w-full h-44 object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-full h-44 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 text-3xl flex-shrink-0">
                    🖼️
                  </div>
                )}

                <div className="p-5 flex flex-col flex-1">
                  <span className={`text-xs px-2 py-1 rounded-md font-medium self-start ${
                    categoryColors[formatCategory(post.category)] || categoryColors.General
                  }`}>
                    {formatCategory(post.category)}
                  </span>

                  <h3 className="text-xl font-semibold mt-2 text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                    {post.title}
                  </h3>

                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 overflow-hidden border-l-4 border-blue-400 dark:border-blue-500 pl-3 [word-break:break-word] [overflow-wrap:anywhere]">
                    {post.description || "No description available."}
                  </p>

                  <div className="mt-4 text-xs text-slate-400 dark:text-slate-500 flex justify-between items-center">
                    <span>{new Date(post.created_at).toLocaleDateString()}</span>
                    <span>Posted {getRelativeTime(post.created_at)}</span>
                  </div>
                </div>

              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-slate-400 dark:text-slate-500">
          No posts found.
        </div>
      )}

    </div>
  );
}
