import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Home() {

  const [posts, setPosts] = useState([]);

useEffect(() => {
  fetch("http://localhost:5000/api/posts/public")
    .then((res) => res.json())
    .then((data) => {
      setPosts(data);
    })
    .catch((err) => console.error(err));
}, []);


  // NORMALIZE CATEGORY 
  const formatCategory = (cat) => {
    if (!cat) return "General";
    return cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase();
  };

  // SORT
  const sortedPosts = [...posts].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  // STATE
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  // GET CLEAN CATEGORIES
  const categories = [
    "All",
    ...new Set(
      sortedPosts.map((p) =>
        formatCategory(p.category)
      )
    )
  ];

  // FILTER 
  const filteredPosts = sortedPosts.filter((post) => {
    const matchSearch =
      post.title
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchCategory =
      activeCategory === "All" ||
      formatCategory(post.category) === activeCategory;

    return matchSearch && matchCategory;
  });

  const featured = filteredPosts[0];
  const rest = filteredPosts.slice(1);

  // READING TIME
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

  // CATEGORY COLORS — light + dark variants
  const categoryColors = {
    Tech:     "bg-blue-50   dark:bg-blue-900/30   text-blue-600   dark:text-blue-400",
    Design:   "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
    Business: "bg-green-50  dark:bg-green-900/30  text-green-600  dark:text-green-400",
    General:  "bg-slate-100 dark:bg-slate-700     text-slate-600  dark:text-slate-300",
  };

  return (
    <div className="w-full px-8 py-10">

      {/* HEADER */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
          Latest Blog Posts
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Thoughts, ideas, and stories.
        </p>
      </div>

      {/* SEARCH */}
      <input
        type="text"
        placeholder="Search posts..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full mb-6 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500 transition"
      />

      {/* CATEGORY FILTER */}
      <div className="flex gap-2 flex-wrap mb-12">
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

      {/* FEATURED */}
      {featured && (
        <Link to={`/blog/${featured.slug}`} className="group block mb-16">
          <div className="rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-xl dark:hover:shadow-slate-900 transition">

            <div className="relative">
              {featured.thumbnail ? (
                <img
                  src={featured.thumbnail}
                  alt={featured.title}
                  className="w-full h-[340px] object-cover"
                />
              ) : (
                <div className="w-full h-[340px] bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 text-5xl">
                  🖼️
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </div>

            <div className="p-8">
              <span className={`text-xs px-2.5 py-1 rounded-md font-medium ${
                categoryColors[formatCategory(featured.category)] || categoryColors.General
              }`}>
                {formatCategory(featured.category)}
              </span>

              <h2 className="text-3xl font-bold mt-3 text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                {featured.title}
              </h2>

              <p className="text-slate-600 dark:text-slate-400 mt-3">
                {featured.description || "No description available."}
              </p>
              <div className="flex justify-between items-center mt-6 text-sm text-slate-500 dark:text-slate-400">
                {/* DATE */}
                <span>{new Date(featured.created_at).toLocaleDateString()}</span>

                {/* AUTHOR + READING TIME */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {featured.author_avatar ? (
                      <img src={featured.author_avatar} alt={featured.author_name} className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold uppercase flex-shrink-0">
                        {featured.author_name?.charAt(0) || "?"}
                      </div>
                    )}
                    <span>{featured.author_name || "Unknown"}</span>
                  </div>
                  <span className="text-slate-300 dark:text-slate-600">·</span>
                  <span>Posted {getRelativeTime(featured.created_at)}</span>
                </div>
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* GRID */}
      <div className="grid md:grid-cols-2 gap-8">
        {rest.map((post) => (
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

                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 flex-1">
                  {post.description || "No description available."}
                </p>
                
                <div className="mt-4 text-xs text-slate-400 dark:text-slate-500 flex justify-between items-center">
                  {/* DATE */}
                  <span>{new Date(post.created_at).toLocaleDateString()}</span>

                  {/* AUTHOR + READING */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      {post.author_avatar ? (
                        <img src={post.author_avatar} alt={post.author_name} className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold uppercase flex-shrink-0">
                          {post.author_name?.charAt(0) || "?"}
                        </div>
                      )}
                      <span>{post.author_name || "Unknown"}</span>
                    </div>
                    <span className="text-slate-300 dark:text-slate-600">·</span>
                    <span>Posted {getRelativeTime(post.created_at)}</span>
                  </div>
                </div>
                </div>
              </div>
          </Link>
        ))}
      </div>
      {filteredPosts.length === 0 && (
        <div className="text-center py-20 text-slate-400 dark:text-slate-500">
          No posts found.
        </div>
      )}
    </div>
  );
}