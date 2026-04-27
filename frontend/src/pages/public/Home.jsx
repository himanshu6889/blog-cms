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
  const getReadingTime = (text = "") => {
    const words = text
      .replace(/<[^>]*>/g, " ")
      .split(/\s+/)
      .filter(Boolean).length;

    return Math.max(1, Math.ceil(words / 200));
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

              <div className="flex justify-between mt-6 text-sm text-slate-500 dark:text-slate-400">
                <span>{new Date(featured.created_at).toLocaleDateString()}</span>
                <span>{getReadingTime(featured.content)} min read</span>
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

                <div className="flex justify-between mt-4 text-xs text-slate-400 dark:text-slate-500">
                  <span>{new Date(post.created_at).toLocaleDateString()}</span>
                  <span>{getReadingTime(post.content)} min read</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* EMPTY */}
      {filteredPosts.length === 0 && (
        <div className="text-center py-20 text-slate-400 dark:text-slate-500">
          No posts found.
        </div>
      )}
    </div>
  );
}