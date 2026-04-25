import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import slugify from "slugify";
import {
  FaRocket, FaImage, FaTag, FaLink, FaPenFancy, FaCheckCircle,
  FaSave, FaBookOpen, FaTimes, FaChevronDown, FaChevronUp, FaLock,
  FaSitemap, FaHistory, FaTrashAlt, FaUpload, FaCloudUploadAlt,
} from "react-icons/fa";
import Editor from "../../editor/Editor";

const DRAFT_KEY = "create_post_draft";
const ACCESS_OPTIONS = ["Anyone", "Logged-in Users", "Only Me", "No One"];
const DEFAULT_ACCESS = {
  read: "Anyone", edit: "Logged-in Users",
  readComments: "Anyone", postComments: "Anyone", viewHistory: "Anyone",
};

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const CROP_W = 480;
const CROP_H = 270;

function ThumbnailUploader({ value, onChange }) {
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);
  const adjImgRef = useRef(null);
  const adjFrameRef = useRef(null);
  const adjDrag = useRef({ active: false, startX: 0, startY: 0, ox: 0, oy: 0 });
  const imgNaturalRef = useRef({ w: 0, h: 0 });

  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjZoom, setAdjZoom] = useState(1);
  const [adjOffset, setAdjOffset] = useState({ x: 0, y: 0 });
  const [adjApplying, setAdjApplying] = useState(false);
  const [imgNatural, setImgNatural] = useState({ w: 0, h: 0 });

  const handleFile = async (file) => {
    setError("");
    if (!file || !file.type.startsWith("image/")) { setError("Only image files are supported."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Image must be smaller than 5 MB."); return; }
    try { onChange(await fileToDataUrl(file)); } catch { setError("Failed to read the image file."); }
  };

  const onFileChange = (e) => { const file = e.target.files?.[0]; if (file) handleFile(file); e.target.value = ""; };
  const onDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const onDrop = (e) => { e.preventDefault(); setIsDragging(false); const file = e.dataTransfer.files?.[0]; if (file) handleFile(file); };

  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement?.tagName;
      const isEditable = tag === "INPUT" || tag === "TEXTAREA" || document.activeElement?.isContentEditable;
      if (isEditable) return;
      const items = Array.from(e.clipboardData?.items || []);
      const imgItem = items.find((i) => i.type.startsWith("image/"));
      if (!imgItem) return;
      e.preventDefault();
      const file = imgItem.getAsFile();
      if (file) handleFile(file);
    };
    window.addEventListener("paste", handler);
    return () => window.removeEventListener("paste", handler);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const el = adjFrameRef.current;
    if (!el) return;
    const handler = (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.08 : -0.08;
      setAdjZoom((prev) => {
        const next = Math.min(3, Math.max(1, prev + delta));
        setAdjOffset((off) => clampOffset(off.x, off.y, next));
        return next;
      });
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [showAdjust]);

  const remove = () => { onChange(""); setError(""); };

  const clampOffset = useCallback((ox, oy, zoom) => {
    const { w: iw, h: ih } = imgNaturalRef.current;
    let maxX, maxY;
    if (iw > 0 && ih > 0) {
      const scaleCover = Math.max(CROP_W / iw, CROP_H / ih);
      const renderedW = iw * scaleCover * zoom;
      const renderedH = ih * scaleCover * zoom;
      maxX = Math.max(0, (renderedW - CROP_W) / 2);
      maxY = Math.max(0, (renderedH - CROP_H) / 2);
    } else {
      maxX = (CROP_W * (zoom - 1)) / 2;
      maxY = (CROP_H * (zoom - 1)) / 2;
    }
    return { x: Math.max(-maxX, Math.min(maxX, ox)), y: Math.max(-maxY, Math.min(maxY, oy)) };
  }, []);

  const openAdjust = () => { setAdjZoom(1); setAdjOffset({ x: 0, y: 0 }); setShowAdjust(true); };
  const onAdjMouseDown = (e) => { e.preventDefault(); adjDrag.current = { active: true, startX: e.clientX, startY: e.clientY, ox: adjOffset.x, oy: adjOffset.y }; };
  const onAdjMouseMove = (e) => { if (!adjDrag.current.active) return; const dx = e.clientX - adjDrag.current.startX; const dy = e.clientY - adjDrag.current.startY; setAdjOffset(clampOffset(adjDrag.current.ox + dx, adjDrag.current.oy + dy, adjZoom)); };
  const onAdjMouseUp = () => { adjDrag.current.active = false; };
  const onAdjTouchStart = (e) => { const t = e.touches[0]; adjDrag.current = { active: true, startX: t.clientX, startY: t.clientY, ox: adjOffset.x, oy: adjOffset.y }; };
  const onAdjTouchMove = (e) => { if (!adjDrag.current.active) return; e.preventDefault(); const t = e.touches[0]; const dx = t.clientX - adjDrag.current.startX; const dy = t.clientY - adjDrag.current.startY; setAdjOffset(clampOffset(adjDrag.current.ox + dx, adjDrag.current.oy + dy, adjZoom)); };
  const onZoomChange = (newZoom) => { setAdjZoom(newZoom); setAdjOffset((prev) => clampOffset(prev.x, prev.y, newZoom)); };

  const applyCrop = async () => {
    const img = adjImgRef.current;
    if (!img) return;
    setAdjApplying(true);
    try {
      const src = value;
      const loadedImg = await new Promise((res, rej) => {
        const i = new Image();
        if (!src.startsWith("data:")) i.crossOrigin = "anonymous";
        i.onload = () => res(i); i.onerror = rej; i.src = src;
      });
      const iw = loadedImg.naturalWidth, ih = loadedImg.naturalHeight;
      const scaleCover = Math.max(CROP_W / iw, CROP_H / ih);
      const totalScale = scaleCover * adjZoom;
      const sourceX = iw / 2 - (CROP_W / 2 + adjOffset.x) / totalScale;
      const sourceY = ih / 2 - (CROP_H / 2 + adjOffset.y) / totalScale;
      const sourceW = CROP_W / totalScale, sourceH = CROP_H / totalScale;
      const canvas = document.createElement("canvas");
      canvas.width = CROP_W; canvas.height = CROP_H;
      canvas.getContext("2d").drawImage(loadedImg, sourceX, sourceY, sourceW, sourceH, 0, 0, CROP_W, CROP_H);
      onChange(canvas.toDataURL("image/jpeg", 0.92));
      setShowAdjust(false);
    } catch {
      setError("Could not crop this image due to cross-origin restrictions. Upload the image directly for full adjustment support.");
      setShowAdjust(false);
    } finally {
      setAdjApplying(false);
    }
  };

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
        <FaImage className="text-pink-500" /> Thumbnail
      </label>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />

      {value ? (
        <>
          <div className="relative group rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-600 shadow-sm">
            <img ref={adjImgRef} src={value} alt="Thumbnail preview" className="w-full h-48 object-cover"
              onLoad={(e) => {
                const nat = { w: e.target.naturalWidth, h: e.target.naturalHeight };
                imgNaturalRef.current = nat;
                setImgNatural(nat);
              }}
              onError={() => { setError("Could not load image from this URL."); onChange(""); }} />
            <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <button type="button" onClick={openAdjust} className="px-3 py-1.5 rounded-xl bg-white text-slate-800 text-xs font-semibold shadow hover:bg-slate-100 transition inline-flex items-center gap-1.5">✂️ Adjust</button>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 rounded-xl bg-white text-slate-800 text-xs font-semibold shadow hover:bg-slate-100 transition inline-flex items-center gap-1.5"><FaUpload size={11} /> Change</button>
              <button type="button" onClick={remove} className="px-3 py-1.5 rounded-xl bg-red-500 text-white text-xs font-semibold shadow hover:bg-red-600 transition inline-flex items-center gap-1.5"><FaTrashAlt size={11} /> Remove</button>
            </div>
          </div>
          {showAdjust && (
            <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center px-4">
              <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-[28px] shadow-2xl p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Adjust Thumbnail</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Drag to reposition · scroll or use slider to zoom</p>
                  </div>
                  <button type="button" onClick={() => setShowAdjust(false)} className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center text-slate-500 dark:text-slate-300 transition">
                    <FaTimes size={13} />
                  </button>
                </div>
                <div ref={adjFrameRef} className="relative overflow-hidden rounded-2xl border-2 border-blue-400 bg-slate-900"
                  style={{ width: "100%", aspectRatio: "16/9", cursor: adjDrag.current.active ? "grabbing" : "grab" }}
                  onMouseDown={onAdjMouseDown} onMouseMove={onAdjMouseMove} onMouseUp={onAdjMouseUp} onMouseLeave={onAdjMouseUp}
                  onTouchStart={onAdjTouchStart} onTouchMove={onAdjTouchMove} onTouchEnd={() => { adjDrag.current.active = false; }}>
                  <img src={value} alt="Adjust" draggable={false} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: `translate(${adjOffset.x}px, ${adjOffset.y}px) scale(${adjZoom})`, transformOrigin: "center center", userSelect: "none", pointerEvents: "none" }} />
                  <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)", backgroundSize: "33.33% 33.33%" }} />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <span>Zoom</span>
                    <span className="text-slate-700 dark:text-slate-200">{adjZoom.toFixed(2)}×</span>
                  </div>
                  <input type="range" min={1} max={3} step={0.01} value={adjZoom} onChange={(e) => onZoomChange(parseFloat(e.target.value))} className="w-full accent-blue-600" />
                  <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500">
                    <span>1× (original)</span><span>3× (max zoom)</span>
                  </div>
                </div>
                {/* Alignment quick-position buttons — only shown when image overflows the frame */}
                {(() => {
                  const { w: iw, h: ih } = imgNatural;
                  if (!iw || !ih) return null;
                  const sc = Math.max(CROP_W / iw, CROP_H / ih);
                  const overflowY = Math.max(0, (ih * sc * adjZoom - CROP_H) / 2);
                  const overflowX = Math.max(0, (iw * sc * adjZoom - CROP_W) / 2);
                  if (overflowY < 2 && overflowX < 2) return null;
                  return (
                    <div className="space-y-2">
                      {overflowY >= 2 && (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 w-14 flex-shrink-0">Vertical</span>
                          <div className="flex gap-1.5 flex-1">
                            {[["Top", overflowY], ["Center", 0], ["Bottom", -overflowY]].map(([label, yVal]) => (
                              <button key={label} type="button"
                                onClick={() => setAdjOffset(o => clampOffset(o.x, yVal, adjZoom))}
                                className={`flex-1 h-7 rounded-lg text-[11px] font-semibold transition border ${Math.abs(adjOffset.y - yVal) < 1 ? "bg-blue-600 border-blue-600 text-white" : "bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600"}`}>
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {overflowX >= 2 && (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 w-14 flex-shrink-0">Horizontal</span>
                          <div className="flex gap-1.5 flex-1">
                            {[["Left", overflowX], ["Center", 0], ["Right", -overflowX]].map(([label, xVal]) => (
                              <button key={label} type="button"
                                onClick={() => setAdjOffset(o => clampOffset(xVal, o.y, adjZoom))}
                                className={`flex-1 h-7 rounded-lg text-[11px] font-semibold transition border ${Math.abs(adjOffset.x - xVal) < 1 ? "bg-blue-600 border-blue-600 text-white" : "bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600"}`}>
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
                <div className="flex gap-3">
                  <button type="button" onClick={() => { setAdjZoom(1); setAdjOffset({ x: 0, y: 0 }); }} className="flex-1 h-11 rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-semibold transition">Reset</button>
                  <button type="button" onClick={applyCrop} disabled={adjApplying} className="flex-1 h-11 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-semibold shadow transition">
                    {adjApplying ? "Applying…" : "Apply Crop"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div ref={dropZoneRef} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition flex flex-col items-center justify-center gap-3 py-10 px-6 text-center ${
              isDragging ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 hover:border-blue-400 hover:bg-blue-50/40 dark:hover:bg-blue-900/10"
            }`}>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition ${isDragging ? "bg-blue-100 text-blue-600" : "bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500"}`}>
              <FaCloudUploadAlt size={28} />
            </div>
            <div>
              <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm">{isDragging ? "Drop image here" : "Click to browse or drag & drop"}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">PNG, JPG, GIF, WebP — max 5 MB</p>
            </div>
          </div>
          <p className="text-[11px] text-center text-slate-400 dark:text-slate-500">
            You can also copy an image anywhere and press{" "}
            <kbd className="bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded px-1 py-0.5 font-mono text-[10px] text-slate-600 dark:text-slate-300">Ctrl+V</kbd>{" "}
            while not typing in a text field.
          </p>
        </>
      )}
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
}

function CollapsibleSection({ title, icon, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
      <button type="button" onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
        <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm flex-shrink-0">
          {open ? <FaChevronDown size={10} /> : <FaChevronUp size={10} />}
        </span>
        <span className="font-semibold text-slate-800 dark:text-slate-100 text-base">{title}</span>
        {icon && <span className="ml-auto text-slate-400 dark:text-slate-500">{icon}</span>}
      </button>
      {open && <div className="border-t border-slate-100 dark:border-slate-700">{children}</div>}
    </div>
  );
}

function SettingRow({ label, hint, children }) {
  return (
    <div className="grid md:grid-cols-2 gap-4 items-start px-6 py-5 border-b border-slate-100 dark:border-slate-700 last:border-0">
      <div>
        <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{label}</p>
        {hint && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 italic leading-snug">{hint}</p>}
      </div>
      <div className="flex items-center">{children}</div>
    </div>
  );
}

function StyledSelect({ value, onChange, options }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 appearance-none pr-8"
      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='%2394a3b8'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}>
      {options.map((opt) => (
        <option key={opt.value ?? opt} value={opt.value ?? opt}>{opt.label ?? opt}</option>
      ))}
    </select>
  );
}

function Field({ icon, label, children }) {
  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">
        {icon}{label}
      </label>
      {children}
    </div>
  );
}

function ModalRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-6 py-1">
      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-sm font-bold text-slate-900 dark:text-white text-right max-w-[60%] truncate">{value}</span>
    </div>
  );
}

export default function CreatePost() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [editorKey, setEditorKey] = useState(0);
  const [editorInitialContent, setEditorInitialContent] = useState("");
  const [tags, setTags] = useState("");
  const [parent, setParent] = useState("none");
  const [existingPosts, setExistingPosts] = useState([]);
  const [assocGroup, setAssocGroup] = useState("none");
  const [access, setAccess] = useState(DEFAULT_ACCESS);

  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState({ title: "", sub: "" });
  const [lastSaved, setLastSaved] = useState("");
  const [draftBanner, setDraftBanner] = useState(false);
  const [draftTimestamp, setDraftTimestamp] = useState("");

  // useEffect(() => {
  //   const stored = JSON.parse(localStorage.getItem("posts")) || [];
  //   setExistingPosts(stored);
  //   const raw = localStorage.getItem(DRAFT_KEY);
  //   if (raw) {
  //     try {
  //       const d = JSON.parse(raw);
  //       if (d.title || d.description || d.content) { setDraftBanner(true); setDraftTimestamp(d._savedAt || ""); }
  //     } catch { localStorage.removeItem(DRAFT_KEY); }
  //   }
  // }, []);

  useEffect(() => {
  const fetchPosts = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/posts");
      const data = await res.json();
      setExistingPosts(data);
    } catch (err) {
      console.error("Error loading posts:", err);
    }
  };

  fetchPosts();

  // draft logic (keep this)
  const raw = localStorage.getItem(DRAFT_KEY);
  if (raw) {
    try {
      const d = JSON.parse(raw);
      if (d.title || d.description || d.content) {
        setDraftBanner(true);
        setDraftTimestamp(d._savedAt || "");
      }
    } catch {
      localStorage.removeItem(DRAFT_KEY);
    }
  }
}, []);

  const handleTitle = (e) => { const v = e.target.value; setTitle(v); setSlug(slugify(v, { lower: true, strict: true })); };
  const plainContent = content.replace(/<[^>]*>/g, " ");
  const wordCount = (description + " " + plainContent).trim().split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));
  const activeCategory = category.trim() || "General";
  const publishDisabled = !title.trim() || !content.trim();

  const writeDraft = useCallback((overrides = {}) => {
    const now = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    const draft = { title, slug, category, thumbnail, description, content, tags, parent, assocGroup, access, _savedAt: now, ...overrides };
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); }
    catch { localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draft, thumbnail: "" })); }
    return now;
  }, [title, slug, category, thumbnail, description, content, tags, parent, assocGroup, access]);

  const clearDraft = () => localStorage.removeItem(DRAFT_KEY);

  useEffect(() => {
    if (!title && !description && !content) return;
    const t = setTimeout(() => { const at = writeDraft(); setLastSaved(at); }, 1500);
    return () => clearTimeout(t);
  }, [title, description, content, writeDraft]);

  const showSuccessToast = (t, sub) => { setToastMsg({ title: t, sub }); setShowToast(true); setTimeout(() => setShowToast(false), 2500); };
  const saveDraft = () => { const at = writeDraft(); setLastSaved(at); showSuccessToast("Draft Saved", "Progress stored locally."); };

  const restoreDraft = () => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      const d = JSON.parse(raw);
      setTitle(d.title || ""); setSlug(d.slug || ""); setCategory(d.category || "");
      setThumbnail(d.thumbnail || ""); setDescription(d.description || "");
      setTags(d.tags || ""); setParent(d.parent || "none");
      setAssocGroup(d.assocGroup || "none"); setAccess(d.access || DEFAULT_ACCESS);
      if (d.content) { setEditorInitialContent(d.content); setContent(d.content); setEditorKey((k) => k + 1); }
      setLastSaved(d._savedAt || ""); setDraftBanner(false);
      showSuccessToast("Draft Restored", `From ${d._savedAt || "last session"}.`);
    } catch { localStorage.removeItem(DRAFT_KEY); setDraftBanner(false); }
  };

  const discardDraft = () => { clearDraft(); setDraftBanner(false); };

  const resetAll = () => {
    setTitle(""); setSlug(""); setCategory(""); setThumbnail(""); setDescription("");
    setContent(""); setTags(""); setParent("none"); setAssocGroup("none");
    setAccess(DEFAULT_ACCESS); setEditorInitialContent(""); setEditorKey((p) => p + 1); setLastSaved("");
  };

    // const persistPost = () => {
    //   const oldPosts = JSON.parse(localStorage.getItem("posts")) || [];
    //   const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);

    //   // Ensure slug is unique — append -2, -3, ... if a collision exists
    //   const baseSlug = slug;
    //   let uniqueSlug = baseSlug;
    //   let counter = 2;
    //   while (oldPosts.some((p) => p.slug === uniqueSlug)) {
    //     uniqueSlug = `${baseSlug}-${counter}`;
    //     counter++;
    //   }

    //   oldPosts.push({ id: Date.now(), title, slug: uniqueSlug, category: activeCategory, thumbnail, description, content, tags: tagList, parent: parent === "none" ? null : parent, associatedGroup: assocGroup === "none" ? null : assocGroup, access, createdAt: Date.now() });
    //   localStorage.setItem("posts", JSON.stringify(oldPosts));
    //   clearDraft();
    // };

  const handlePublish = async () => {
  try {
    const postData = {
      title,
      slug: slugify(title, { lower: true, strict: true }) + "-" + Date.now(),
      category: category || "General",
      thumbnail,
      description,
      content,
      tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      parent_post: parent === "none" ? null : parent,
      access: access.read,
      edit_access: access.edit,
    };

    console.log("🚀 Sending post:", postData);

    const res = await fetch("http://localhost:5000/api/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData),
    });

    // ✅ IMPORTANT CHECK
    if (!res.ok) {
      const error = await res.json();
      console.error("❌ Backend error:", error);
      alert(error.error || "Failed to create post");
      return;
    }

    const data = await res.json();
    console.log("✅ Response:", data);

    clearDraft();
    setShowPublishModal(false);
    showSuccessToast("Post Published", "Saved to database 🚀");

    resetAll();
    setTimeout(() => navigate("/admin/posts"), 1500);

  } catch (err) {
    console.error("❌ Error creating post:", err);
  }
};
  // const handlePublish = () => { persistPost(); setShowPublishModal(false); showSuccessToast("Post Published", "Redirecting..."); resetAll(); setTimeout(() => navigate("/admin/posts"), 1500); };
  const handleSave = async () => {
  await handlePublish();
};
  // const handleSave = () => { persistPost(); navigate("/admin/posts"); };
  const handleCancel = () => { resetAll(); navigate("/admin/posts"); };

  const parentOptions = [{ value: "none", label: "(no parent)" }, ...existingPosts.map((p) => ({ value: p.slug, label: p.title }))];
  const setAccessField = (key, val) => setAccess((prev) => ({ ...prev, [key]: val }));

  return (
    <div className="space-y-8">

      {/* Toast */}
      {showToast && (
        <div className="fixed top-6 right-6 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl px-5 py-4 min-w-[280px]">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center flex-shrink-0"><FaCheckCircle /></div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white">{toastMsg.title}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{toastMsg.sub}</p>
            </div>
          </div>
        </div>
      )}

      {/* Draft banner */}
      {draftBanner && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl px-6 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 flex items-center justify-center flex-shrink-0"><FaHistory /></div>
            <div>
              <p className="font-bold text-amber-900 dark:text-amber-300 text-sm">Unsaved draft found</p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">{draftTimestamp ? `Last auto-saved at ${draftTimestamp}` : "A previous session left an unsaved draft."}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={restoreDraft} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition"><FaHistory size={12} /> Restore Draft</button>
            <button onClick={discardDraft} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-700 hover:bg-amber-100 dark:hover:bg-slate-600 border border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-300 text-sm font-semibold transition"><FaTrashAlt size={12} /> Discard</button>
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div>
          <h1 className="text-5xl font-black text-slate-900 dark:text-white">Create Post</h1>
          <div className="flex flex-wrap gap-3 mt-2 items-center">
            <p className="text-lg text-slate-500 dark:text-slate-400">Write, organize, and publish.</p>
            {lastSaved && (
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 rounded-full">
                Draft saved • {lastSaved}
              </span>
            )}
          </div>
        </div>
        <button
          disabled={publishDisabled} onClick={() => setShowPublishModal(true)}
          className={`px-7 py-4 rounded-2xl font-semibold shadow-lg transition inline-flex items-center gap-2 ${publishDisabled ? "bg-slate-300 dark:bg-slate-600 text-white cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
        >
          <FaRocket /> Publish
        </button>
      </div>

      {/* Main grid */}
      <div className="grid xl:grid-cols-3 gap-6">

        {/* Left: editor area */}
        <div className="xl:col-span-2 space-y-6">

          {/* Title */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
            <label className="text-sm uppercase tracking-[0.18em] font-semibold text-slate-500 dark:text-slate-400">Title</label>
            <input
              type="text" placeholder="Enter post title..." value={title} onChange={handleTitle}
              className="w-full mt-4 text-4xl lg:text-5xl font-black text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 outline-none bg-transparent"
            />
          </div>

          {/* Short Description */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
            <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white mb-4">
              <FaPenFancy className="text-blue-600" /> Short Description
            </div>
            <textarea
              value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Write a short summary for readers..."
              className="w-full h-32 resize-none rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 px-4 py-4 outline-none focus:border-blue-500"
            />
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">Keep it clear and engaging.</p>
          </div>

          {/* Editor */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Content Editor</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Build your article below.</p>
              </div>
              <div className="flex gap-2">
                <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-semibold px-4 py-2 rounded-2xl">{wordCount} words</span>
                <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-semibold px-4 py-2 rounded-2xl inline-flex items-center gap-2"><FaBookOpen /> {readingTime} min</span>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-600 overflow-hidden min-h-[460px]">
              <Editor key={editorKey} onUpdate={setContent} initialContent={editorInitialContent} />
            </div>
          </div>

        </div>

        {/* Right sidebar */}
        <div className="space-y-6">

          {/* Publish card */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Publish</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-5">Save progress or publish when ready.</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={saveDraft} className="py-3 rounded-2xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 font-semibold text-slate-800 dark:text-white transition inline-flex items-center justify-center gap-2">
                <FaSave /> Save Draft
              </button>
              <button
                disabled={publishDisabled} onClick={() => setShowPublishModal(true)}
                className={`py-3 rounded-2xl font-semibold transition inline-flex items-center justify-center gap-2 ${publishDisabled ? "bg-slate-300 dark:bg-slate-600 text-white cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
              >
                <FaRocket /> Review & Publish
              </button>
            </div>
            {lastSaved ? (
              <div className="mt-4 text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-2"><FaCheckCircle /> Draft saved at {lastSaved}</div>
            ) : (
              <div className="mt-4 text-xs text-slate-400 dark:text-slate-500 font-medium flex items-center gap-2"><FaSave className="opacity-40" /> Auto-saves</div>
            )}
          </div>

          {/* Post Settings */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-5">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Post Settings</h2>

            <Field icon={<FaLink className="text-blue-600" />} label="Slug">
              <input value={slug} readOnly className="w-full rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-3 outline-none" />
            </Field>

            <Field icon={<FaTag className="text-green-600" />} label="Category">
              <input value={category} onChange={(e) => setCategory(e.target.value)}
                placeholder="Optional (Default: General)"
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 px-4 py-3 text-sm outline-none focus:border-blue-500 opacity-75" />
            </Field>

            <ThumbnailUploader value={thumbnail} onChange={setThumbnail} />
          </div>

        </div>
      </div>

      {/* Advanced sections */}
      <CollapsibleSection title="Tags" icon={<FaTag size={13} />}>
        <SettingRow label="Tags are words or phrases that help to describe and organize your Blog.">
          <input type="text" value={tags} onChange={(e) => setTags(e.target.value)}
            placeholder="e.g. react, javascript, tutorial"
            className="w-full rounded-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 px-4 py-2.5 text-sm outline-none focus:border-blue-500" />
        </SettingRow>
      </CollapsibleSection>

      <CollapsibleSection title="Parent" icon={<FaSitemap size={13} />}>
        <SettingRow label="Select a parent for this Blog." hint="(Optional) A link to the parent will appear at the bottom of this post, and vice versa.">
          <StyledSelect value={parent} onChange={setParent} options={parentOptions} />
        </SettingRow>
      </CollapsibleSection>

      <CollapsibleSection title="Access" icon={<FaLock size={13} />}>
        <SettingRow label="Who can read this Blog?"><StyledSelect value={access.read} onChange={(v) => setAccessField("read", v)} options={ACCESS_OPTIONS} /></SettingRow>
        <SettingRow label="Who can edit this Blog?"><StyledSelect value={access.edit} onChange={(v) => setAccessField("edit", v)} options={ACCESS_OPTIONS} /></SettingRow>
        <SettingRow label="Who can read comments on this Blog?"><StyledSelect value={access.readComments} onChange={(v) => setAccessField("readComments", v)} options={ACCESS_OPTIONS} /></SettingRow>
        <SettingRow label="Who can post comments on this Blog?"><StyledSelect value={access.postComments} onChange={(v) => setAccessField("postComments", v)} options={ACCESS_OPTIONS} /></SettingRow>
        <SettingRow label="Who can view the history of this Blog?"><StyledSelect value={access.viewHistory} onChange={(v) => setAccessField("viewHistory", v)} options={ACCESS_OPTIONS} /></SettingRow>
      </CollapsibleSection>

      {/* Publish modal */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-md flex items-center justify-center px-4">
          <div className="w-full max-w-xl bg-white dark:bg-slate-800 rounded-[34px] shadow-[0_35px_90px_rgba(0,0,0,0.22)] p-8 relative">
            <button onClick={() => setShowPublishModal(false)}
              className="absolute top-5 right-5 w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <FaTimes />
            </button>
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center mb-6">
              <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl"><FaRocket /></div>
            </div>
            <h2 className="text-4xl font-black text-slate-900 dark:text-white text-center">Publish Post?</h2>
            <p className="text-center text-slate-500 dark:text-slate-400 mt-3 text-lg">Everything looks ready. Publish now.</p>

            {thumbnail && <img src={thumbnail} alt="Thumbnail" className="w-full h-32 object-cover rounded-2xl border border-slate-200 dark:border-slate-700 mt-5" />}

            <div className="mt-5 rounded-3xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-6 space-y-3">
              <ModalRow label="Title" value={title.trim().length < 3 ? "Untitled Draft" : title} />
              <ModalRow label="Category" value={activeCategory} />
              <ModalRow label="Words" value={wordCount} />
              <ModalRow label="Read Time" value={`${readingTime} min`} />
              <ModalRow label="Slug" value={slug || "-"} />
              {tags && <ModalRow label="Tags" value={tags.split(",").map((t) => t.trim()).filter(Boolean).join(", ")} />}
              <ModalRow label="Thumbnail" value={thumbnail ? "✓ Set" : "None"} />
              <ModalRow label="Access" value={`Read: ${access.read} · Edit: ${access.edit}`} />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-8">
              <button onClick={() => setShowPublishModal(false)}
                className="h-14 rounded-2xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-semibold transition">
                Back to Edit
              </button>
              <button
  type="button"
  onClick={() => {
    console.log("🔥 FINAL CLICK");
    handlePublish();
  }}
  className="h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg transition"
>
  Publish Post
</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
