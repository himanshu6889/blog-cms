import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import Editor from "../../editor/Editor";

export default function EditPost() {
  const navigate = useNavigate();
  const { slug } = useParams();

  const [currentPost, setCurrentPost] = useState(null);
  const [isFetching, setIsFetching] = useState(true); //  track fetch status separately

  // Fetch the post
  useEffect(() => {
    const fetchPost = async () => {
      try {
        setIsFetching(true);
        const res = await fetch("http://localhost:5000/api/posts", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const data = await res.json();
        if (!Array.isArray(data)) {
          console.error("Invalid API response:", data);
          setCurrentPost(null);
          return;
        }
        const found = data.find((p) => p.slug === slug);
        setCurrentPost(found || null);
      } catch (err) {
        console.error("Error loading post:", err);
      } finally {
        setIsFetching(false);
      }
    };
    fetchPost();
  }, [slug]);

  const draftKey = `draft-${slug}`;

  // ✅ Form fields — start empty, populated by useEffect below once post loads
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [editorInitial, setEditorInitial] = useState("");

  const [initialState, setInitialState] = useState({ title: "", category: "", description: "", content: "" });
  const [lastSaved, setLastSaved] = useState({ title: "", category: "", description: "", content: "" });

  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState("saved");
  const [showDraftPopup, setShowDraftPopup] = useState(false);
  const [draftData, setDraftData] = useState(null);
  const [hasCheckedDraft, setHasCheckedDraft] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const timeoutRef = useRef(null);

  // ✅ Populate form fields once currentPost is fetched
  useEffect(() => {
    if (!currentPost) return;

    const original = {
      title: currentPost.title || "",
      category: currentPost.category || "",
      description: currentPost.description || "",
      content: currentPost.content || "",
    };

    setTitle(original.title);
    setCategory(original.category);
    setDescription(original.description);
    setContent(original.content);
    setEditorInitial(original.content);
    setInitialState(original);
    setLastSaved(original);
  }, [currentPost]);

  const isDraftDifferent = (draft, original) => {
    if (!draft || !original) return false;
    return (
      draft.title !== (original.title || "") ||
      draft.category !== (original.category || "") ||
      draft.description !== (original.description || "") ||
      draft.content !== (original.content || "")
    );
  };

  // ✅ Check for draft only after post is loaded and form is populated
  useEffect(() => {
    if (!currentPost || hasCheckedDraft) return;
    const draft = localStorage.getItem(draftKey);
    if (draft) {
      const parsed = JSON.parse(draft);
      if (isDraftDifferent(parsed, currentPost)) {
        setDraftData(parsed);
        setShowDraftPopup(true);
      } else {
        localStorage.removeItem(draftKey);
      }
    }
    setHasCheckedDraft(true);
  }, [currentPost, hasCheckedDraft, draftKey]);

  // Auto-save draft
  useEffect(() => {
    if (!hasCheckedDraft || showDraftPopup) return;
    const isSame =
      title === lastSaved.title &&
      category === lastSaved.category &&
      description === lastSaved.description &&
      content === lastSaved.content;
    if (isSame) { setSaveStatus("saved"); return; }
    setSaveStatus("unsaved");
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setSaveStatus("saving");
      localStorage.setItem(draftKey, JSON.stringify({ title, category, description, content }));
      setLastSaved({ title, category, description, content });
      setSaveStatus("saved");
    }, 800);
    return () => clearTimeout(timeoutRef.current);
  }, [title, category, description, content, lastSaved, hasCheckedDraft, showDraftPopup, draftKey]);

  const handleRestoreDraft = () => {
    if (!draftData) return;
    setTitle(draftData.title || "");
    setCategory(draftData.category || "");
    setDescription(draftData.description || "");
    setContent(draftData.content || "");
    setEditorInitial(draftData.content || "");
    setLastSaved(draftData);
    setInitialState(draftData);
    setShowDraftPopup(false);
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem(draftKey);
    const original = {
      title: currentPost.title || "",
      category: currentPost.category || "",
      description: currentPost.description || "",
      content: currentPost.content || "",
    };
    setLastSaved(original);
    setInitialState(original);
    setShowDraftPopup(false);
  };

  const handleUpdate = async () => {
    if (!title.trim()) return;
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/posts/${currentPost.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ title, category, description, content }),
      });

      const data = await res.json();

      if (!res.ok) {
          console.error("Update failed:", data);
          alert(data.error || "Update failed");
          return;
        }

        localStorage.removeItem(draftKey);
        setShowSuccess(true);
        setTimeout(() => navigate("/admin/posts"), 1000);
      } catch (err) {
        console.error("Update error:", err);
      } finally {
        setLoading(false);
      }
    };

  const hasUnsavedChanges =
    title !== initialState.title ||
    category !== initialState.category ||
    description !== initialState.description ||
    content !== initialState.content;

  const wordCount = content.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;

  const renderSaveStatus = () => {
    if (saveStatus === "saving") return "Saving...";
    if (saveStatus === "unsaved") return "Unsaved changes";
    return "Saved";
  };

  // ✅ Show spinner while loading — not "Post Not Found"
  if (isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500 dark:text-slate-400 text-lg animate-pulse">Loading post...</p>
      </div>
    );
  }

  // ✅ Only show "not found" after fetch completes with no result
  if (!currentPost) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Post Not Found</h1>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">

      {/* Draft restore popup */}
      {showDraftPopup && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-[360px] text-center shadow-xl">
            <h2 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white">Restore draft?</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">We found unsaved changes.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={handleDiscardDraft} className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600 transition">
                Discard
              </button>
              <button onClick={handleRestoreDraft} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition">
                Restore
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel confirm */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl w-[360px] text-center shadow-xl">
            <h2 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white">Discard changes?</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">You have unsaved changes.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setShowCancelConfirm(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition">
                Keep Editing
              </button>
              <button onClick={() => navigate("/admin/posts")} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success toast */}
      {showSuccess && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-white dark:bg-slate-800 px-6 py-3 rounded-xl shadow-lg text-green-600 dark:text-green-400 font-medium border border-slate-200 dark:border-slate-700">
            ✔ Post updated
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-10 flex justify-between items-center">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Edit Post</h1>
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
        >
          ← Back
        </button>
      </div>

      {/* Form */}
      <div className="space-y-6 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div>
          <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white p-3 rounded-lg outline-none focus:border-blue-500 dark:focus:border-blue-400 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            placeholder="Title"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Category</label>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white p-3 rounded-lg outline-none focus:border-blue-500 dark:focus:border-blue-400 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            placeholder="Category"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white p-3 rounded-lg h-24 outline-none focus:border-blue-500 dark:focus:border-blue-400 resize-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
            placeholder="Description"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Content</label>
          <div className="rounded-xl border border-slate-200 dark:border-slate-600 overflow-hidden">
            <Editor key={slug} initialHtml={editorInitial} onUpdate={setContent} />
          </div>
        </div>

        <p className="text-xs text-slate-400 dark:text-slate-500">{wordCount} words</p>
      </div>

      {/* Actions */}
      <div className="mt-8 flex justify-between items-center">
        <span className="text-xs text-slate-400 dark:text-slate-500">{renderSaveStatus()}</span>
        <div className="flex gap-3">
          <button
            onClick={() => { if (hasUnsavedChanges) setShowCancelConfirm(true); else navigate("/admin/posts"); }}
            className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600 transition font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition font-semibold disabled:opacity-60"
          >
            {loading ? "Updating..." : "Update"}
          </button>
        </div>
      </div>
    </div>
  );
}
