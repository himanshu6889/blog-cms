import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import API_BASE from "../../api"; 

export default function BlogDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    const fetchPost = async () => {
  try {
    setLoading(true);

    const res = await fetch(`${API_BASE}/api/posts/${slug}`);
    const data = await res.json();

    console.log("POST DATA:", data);

    if (data.error) {
      setPost(null);
    } else {
      setPost(data);
    }

  } catch (err) {
    console.error("Error loading post:", err);
  } finally {
    setLoading(false);
  }
};
fetchPost();
}, [slug]);

  const formatDate = (value) => {
    const date = new Date(value);
    if (isNaN(date)) return "";
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
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

  //  Show spinner while fetching — not "Post Not Found"
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <p className="text-slate-500 dark:text-slate-400 text-lg animate-pulse">
          Loading post...
        </p>
      </div>
    );
  }

  //  Only show "not found" after fetch is complete and post is still null
  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <h1 className="text-4xl font-bold text-slate-700 dark:text-slate-300">
          Post Not Found
        </h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen">

      {/* Top Nav */}
      <section className="w-full px-8 pt-6">
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-semibold transition"
          >
            ← Back
          </button>

          <div className="text-sm text-slate-500 dark:text-slate-400">
            <Link to="/" className="hover:text-blue-600 dark:hover:text-blue-400">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="text-slate-700 dark:text-slate-300 font-medium">
              {post.title}
            </span>
          </div>
        </div>
      </section>

      {/* Hero */}
      <section className="w-full px-8 pb-8">
        {post.thumbnail && (
          <img
            src={post.thumbnail}
            alt={post.title}
            className="w-full h-[420px] object-cover rounded-3xl shadow-xl mb-8"
          />
        )}

        <span className="inline-block px-4 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 text-sm font-semibold mb-5">
          {post.category || "General"}
        </span>

        <h1 className="text-5xl font-bold text-slate-900 dark:text-white leading-tight mb-5">
          {post.title}
        </h1>

        <div className="flex flex-wrap gap-5 text-slate-500 dark:text-slate-400 text-sm mb-6">
          <span>🕒 Posted {getRelativeTime(post.created_at)}</span>
          
          <div className="flex items-center gap-2">

            {/* Avatar */}
            {post.author_avatar ? (
              <img src={post.author_avatar} alt={post.author_name} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold uppercase flex-shrink-0">
                {post.author_name?.charAt(0) || "?"}
              </div>
            )}

              {/* Name */}
              <span className="font-medium">
                {post.author_name || "Unknown"}
                </span>
                
                </div>

        </div>

      </section>

      {/* Description + Content — same width, same card style */}
      <section className="w-full px-8 pb-16 flex flex-col gap-6">

        {/* Description — transparent, blends with page background */}
        {post.description && (
          <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed px-2 [word-break:break-word] [overflow-wrap:anywhere]">
            {post.description}
          </p>
        )}

        {/* Content Box */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-xl dark:shadow-slate-900 p-8 md:p-12 overflow-hidden">
          <div
            className="prose prose-lg dark:prose-invert max-w-none prose-img:rounded-2xl prose-headings:text-slate-900 dark:prose-headings:text-white prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-a:text-blue-600 dark:prose-a:text-blue-400 [word-break:break-word] [overflow-wrap:anywhere]"
            dangerouslySetInnerHTML={{
              __html: post.content || "<p>No content found.</p>",
            }}
          />
        </div>

      </section>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="w-full px-8 pb-20">
          <h2 className="text-3xl font-bold mb-8 text-slate-900 dark:text-white">
            Related Posts
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {relatedPosts.map((item) => (
              <Link
                key={item.id}
                to={`/blog/${item.slug}`}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-lg overflow-hidden hover:-translate-y-1 hover:shadow-2xl dark:hover:shadow-slate-900 transition"
              >
                {item.thumbnail && (
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-48 object-cover"
                  />
                )}

                <div className="p-5">
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400">
                    {item.category}
                  </span>

                  <h3 className="text-xl font-bold mt-4 text-slate-900 dark:text-white">
                    {item.title}
                  </h3>

                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
                    Posted {getRelativeTime(item.created_at)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
