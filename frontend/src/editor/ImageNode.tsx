/**
 * ImageNode — Lexical decorator node with Word-style image controls:
 *  • 8-handle resize (corners lock aspect ratio)
 *  • Word-style Layout Options panel (wrap modes: inline, float-left, center, float-right)
 *  • Rotate ±90°
 *  • Drag to reposition (double-click) in non-inline modes
 *  • Delete button + Backspace / Delete key support
 *
 * FIXES in this version:
 *  1. [FIX] Drag now uses CSS *margin* on the outer Lexical host element instead of
 *     CSS transform on the inner React span. Margins affect actual layout flow so text
 *     reflows around the image as you drag it — previously text stayed put and the image
 *     could overlap / hide text below it.
 *  2. [FIX] Layout panel uses position:fixed anchored to the layout button's viewport
 *     rect, clamped to viewport bounds. It is ALWAYS fully visible regardless of where
 *     the image sits in the editor — no more half-clipped panels.
 *  3. [FIX] Layout panel is ~15% smaller (width 175 px, tighter padding).
 *  4. [FIX] float-right horizontal drag locked (X=0) — dragging was counterintuitive
 *     (right drag ≠ move right) because marginRight is inverted relative to clientX.
 *     float-right and center only allow vertical repositioning.
 *  5. Center wrap mode centers the image (display:block on host span, text-align:center).
 *  6. miniFlipY correctly computed — mini toolbar flips ABOVE the image when near bottom.
 *  7. Layout panel auto-closes after a layout option is selected.
 *  8. Backspace / Delete key deletes the image when visually selected.
 *
 * FIX [INLINE / CENTRE TEXT FLOW — Issues 1 & 2]:
 *  Previously isInline() returned false, which made Lexical treat every image as a
 *  block-level node (like a paragraph). This meant no text could ever share the same
 *  line as the image. Returning true makes the node an inline character in the Lexical
 *  AST — identical to Word's "In Line with Text" behaviour. All visual layout differences
 *  (float-left, float-right, center) are handled through CSS on the host <span>, so the
 *  change does not affect any wrapping mode visually.
 *
 *  With isInline() = true:
 *   • "inline" mode  → display:inline-block, cursor can be placed before/after
 *   • "float-left"   → CSS float:left, surrounding text wraps around
 *   • "float-right"  → CSS float:right, surrounding text wraps around
 *   • "center"       → display:block + margin:auto — browser splits the paragraph into
 *                       anonymous block boxes, image appears centred on its own line
 *                       with text above and below, cursor still reachable before it
 */

import type {
  DOMConversionMap,
  DOMExportOutput,
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical';
import {$getNodeByKey, DecoratorNode} from 'lexical';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {JSX, useEffect, useLayoutEffect, useRef, useState} from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type WrapMode = 'inline' | 'float-left' | 'float-right' | 'center';

export type SerializedImageNode = Spread<
  {
    src: string;
    altText: string;
    width?: number;
    height?: number;
    rotation: number;
    wrapMode: WrapMode;
    offsetX: number;
    offsetY: number;
  },
  SerializedLexicalNode
>;

// ─── Resize handles ───────────────────────────────────────────────────────────

type HandleDir = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';
const ALL_HANDLES: HandleDir[] = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];

const HANDLE_POS: Record<HandleDir, React.CSSProperties> = {
  n:  {top: -5,    left: '50%', transform: 'translateX(-50%)', cursor: 'n-resize'},
  ne: {top: -5,    right: -5,                                  cursor: 'ne-resize'},
  e:  {top: '50%', right: -5,   transform: 'translateY(-50%)', cursor: 'e-resize'},
  se: {bottom: -5, right: -5,                                  cursor: 'se-resize'},
  s:  {bottom: -5, left: '50%', transform: 'translateX(-50%)', cursor: 's-resize'},
  sw: {bottom: -5, left: -5,                                   cursor: 'sw-resize'},
  w:  {top: '50%', left: -5,    transform: 'translateY(-50%)', cursor: 'w-resize'},
  nw: {top: -5,    left: -5,                                   cursor: 'nw-resize'},
};

// ─── Layout panel wrap-mode definitions ──────────────────────────────────────

const INLINE_MODE: {mode: WrapMode; title: string; svg: JSX.Element} = {
  mode: 'inline',
  title: 'In Line with Text',
  svg: (
    <svg width="42" height="34" viewBox="0 0 42 34" fill="none">
      <rect x="1" y="1" width="40" height="32" rx="3" fill="white" stroke="#d1d5db" strokeWidth="1.5"/>
      <rect x="5"  y="6"  width="32" height="3" rx="1" fill="#d1d5db"/>
      <rect x="5"  y="11" width="14" height="11" rx="1" fill="#9ca3af"/>
      <rect x="21" y="11" width="16" height="3"  rx="1" fill="#d1d5db"/>
      <rect x="21" y="16" width="16" height="3"  rx="1" fill="#d1d5db"/>
      <rect x="5"  y="24" width="32" height="3"  rx="1" fill="#d1d5db"/>
    </svg>
  ),
};

const WRAP_MODES: {mode: WrapMode; title: string; label: string; svg: JSX.Element}[] = [
  {
    mode: 'float-left',
    title: 'Wrap Text – Float Left',
    label: 'Float Left',
    svg: (
      <svg width="42" height="34" viewBox="0 0 42 34" fill="none">
        <rect x="1" y="1" width="40" height="32" rx="3" fill="white" stroke="#d1d5db" strokeWidth="1"/>
        <rect x="4"  y="4"  width="16" height="13" rx="1" fill="#9ca3af"/>
        <rect x="22" y="4"  width="16" height="3"  rx="1" fill="#d1d5db"/>
        <rect x="22" y="9"  width="16" height="3"  rx="1" fill="#d1d5db"/>
        <rect x="22" y="14" width="16" height="3"  rx="1" fill="#d1d5db"/>
        <rect x="4"  y="19" width="34" height="3"  rx="1" fill="#d1d5db"/>
        <rect x="4"  y="24" width="34" height="3"  rx="1" fill="#d1d5db"/>
      </svg>
    ),
  },
  {
    mode: 'center',
    title: 'Wrap Text – Center',
    label: 'Center',
    svg: (
      <svg width="42" height="34" viewBox="0 0 42 34" fill="none">
        <rect x="1" y="1" width="40" height="32" rx="3" fill="white" stroke="#d1d5db" strokeWidth="1"/>
        <rect x="13" y="8" width="16" height="13" rx="1" fill="#9ca3af"/>
        <rect x="4"  y="4"  width="34" height="3"  rx="1" fill="#d1d5db"/>
        <rect x="4"  y="24" width="34" height="3"  rx="1" fill="#d1d5db"/>
      </svg>
    ),
  },
  {
    mode: 'float-right',
    title: 'Wrap Text – Float Right',
    label: 'Float Right',
    svg: (
      <svg width="42" height="34" viewBox="0 0 42 34" fill="none">
        <rect x="1" y="1" width="40" height="32" rx="3" fill="white" stroke="#d1d5db" strokeWidth="1"/>
        <rect x="22" y="4"  width="16" height="13" rx="1" fill="#9ca3af"/>
        <rect x="4"  y="4"  width="16" height="3"  rx="1" fill="#d1d5db"/>
        <rect x="4"  y="9"  width="16" height="3"  rx="1" fill="#d1d5db"/>
        <rect x="4"  y="14" width="16" height="3"  rx="1" fill="#d1d5db"/>
        <rect x="4"  y="19" width="34" height="3"  rx="1" fill="#d1d5db"/>
        <rect x="4"  y="24" width="34" height="3"  rx="1" fill="#d1d5db"/>
      </svg>
    ),
  },
];

// ─── React component ──────────────────────────────────────────────────────────

interface ImageComponentProps {
  src: string;
  altText: string;
  width: number | undefined;
  height: number | undefined;
  rotation: number;
  wrapMode: WrapMode;
  offsetX: number;
  offsetY: number;
  nodeKey: NodeKey;
}

function ImageComponent({
  src, altText, width, height, rotation, wrapMode, offsetX, offsetY, nodeKey,
}: ImageComponentProps): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const [isSelected, setIsSelected] = useState(false);
  const [showPanel, setShowPanel]   = useState(false);
  // panelAnchor: viewport-fixed {top, left} for the layout panel (position:fixed).
  // Computed from the layout button's bounding rect when the panel opens so the
  // panel is ALWAYS fully visible regardless of the image's position in the editor.
  const [panelAnchor, setPanelAnchor] = useState<{top: number; left: number} | null>(null);
  const [miniShift, setMiniShift]   = useState(0);
  const [miniFlipY, setMiniFlipY]   = useState(false);

  const containerRef  = useRef<HTMLSpanElement>(null);
  const layoutBtnRef  = useRef<HTMLButtonElement>(null);
  const miniRef       = useRef<HTMLSpanElement>(null);

  // ── Drag is available in every wrap mode EXCEPT inline ───────────────────
  const isDraggable = wrapMode !== 'inline';

  // Used to detect double-click (two pointerdowns within 400 ms)
  const lastClickTimeRef = useRef(0);

  // ── Deselect on outside click ─────────────────────────────────────────────
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setIsSelected(false);
        setShowPanel(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  useEffect(() => { if (!isSelected) setShowPanel(false); }, [isSelected]);

  // ── Backspace / Delete key removes the image when selected ───────────────
  useEffect(() => {
    if (!isSelected) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Backspace' && e.key !== 'Delete') return;
        const active = document.activeElement;
        const isInsideEditor = containerRef.current?.closest('[contenteditable="true"]')?.contains(active);
        if (!isInsideEditor) return;
        e.preventDefault();
        editor.update(() => { $getNodeByKey(nodeKey)?.remove();
        });
    };
    document.addEventListener('keydown', handleKeyDown, true);
    return () => {document.removeEventListener('keydown', handleKeyDown, true)};
  }, [editor, isSelected, nodeKey]);

  // ── Mini toolbar: clamp horizontally + flip vertically when near edges ────
  //
  // FIXED: previously miniFlipY was never set to true because the useLayoutEffect
  // only computed horizontal shift. Now we also check whether the mini toolbar
  // (rendered below the image) would clip below the viewport or editor bottom,
  // and flip it above the image in that case.
  useLayoutEffect(() => {
    if (!isSelected) {
      setMiniShift(0);
      setMiniFlipY(false);
      return;
    }

    const id = requestAnimationFrame(() => {
      const mini = miniRef.current;
      const cont = containerRef.current;
      if (!mini || !cont) return;

      const mRect = mini.getBoundingClientRect();
      const host  = (cont.closest('[contenteditable="true"]') as HTMLElement | null)
                 ?? (cont.offsetParent as HTMLElement | null);
      if (!host) return;
      const hRect = host.getBoundingClientRect();

      // ── Horizontal clamp ──────────────────────────────────────────────────
      let shift = 0;
      if (mRect.right > hRect.right - 8) shift = hRect.right - 8 - mRect.right;
      if (mRect.left  < hRect.left  + 8) shift = hRect.left  + 8 - mRect.left;
      setMiniShift(shift);

      // ── Vertical flip ─────────────────────────────────────────────────────
      // mRect is where the toolbar is NOW (rendered below the image).
      // If its bottom would clip below the visible editor area or viewport, flip it.
      const editorBottom = Math.min(window.innerHeight, hRect.bottom);
      setMiniFlipY(mRect.bottom > editorBottom - 4);
    });
    return () => cancelAnimationFrame(id);
  }, [isSelected]);

  // ── Patch helpers ─────────────────────────────────────────────────────────
  type Patches = Partial<{
    __width: number; __height: number; __rotation: number;
    __wrapMode: WrapMode; __offsetX: number; __offsetY: number;
  }>;
  const patch = (patches: Patches) => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isImageNode(node)) Object.assign(node.getWritable(), patches);
    });
  };

  // ── Resize ────────────────────────────────────────────────────────────────
  const startResize = (e: React.MouseEvent, dir: HandleDir) => {
    e.preventDefault(); e.stopPropagation();
    const startX = e.clientX, startY = e.clientY;
    const startW = width  ?? containerRef.current?.offsetWidth  ?? 300;
    const startH = height ?? containerRef.current?.offsetHeight ?? 200;
    const ratio  = startW / startH;
    const isCorner = dir.length === 2;
    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX, dy = ev.clientY - startY;
      let newW = startW, newH = startH;
      if (dir.includes('e')) newW = Math.max(40, startW + dx);
      if (dir.includes('w')) newW = Math.max(40, startW - dx);
      if (dir.includes('s')) newH = Math.max(40, startH + dy);
      if (dir.includes('n')) newH = Math.max(40, startH - dy);
      if (isCorner) {
        if (dir.includes('e') || dir.includes('w')) newH = Math.round(newW / ratio);
        else newW = Math.round(newH * ratio);
      }
      patch({__width: Math.round(newW), __height: Math.round(newH)});
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // ── Delete (toolbar button) ───────────────────────────────────────────────
  const deleteImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    editor.update(() => { $getNodeByKey(nodeKey)?.remove(); });
  };

  // ── Drag to reposition (all non-inline modes) ────────────────────────────
  //
  // FIXED: vertical boundary now uses clientHeight (visible height) rather than
  // scrollHeight. CSS transforms don't contribute to scrollable overflow, so
  // using scrollHeight let the image silently leave the visible viewport with
  // no scrollbar appearing. Clamping to clientHeight keeps the image always
  // within the visible portion of the editor.
  const startDrag = (e: React.MouseEvent) => {
    if (!isDraggable) return;
    e.preventDefault(); e.stopPropagation();

    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const startOX = offsetX;
    const startOY = offsetY;

    const host = containerRef.current?.closest('[contenteditable="true"]') as HTMLElement | null;

    let minOX = -Infinity, maxOX = Infinity;
    let minOY = -Infinity, maxOY = Infinity;

    if (host && containerRef.current) {
      const PADDING = 4;
      const hRect = host.getBoundingClientRect();
      const cRect = containerRef.current.getBoundingClientRect();

      // For float-left: ox = marginLeft, so naturalLeft = cRect.left - startOX.
      // For float-right/center: X is locked (see below), so these values aren't used.
      const naturalLeft   = cRect.left   - startOX;
      const naturalRight  = cRect.right  - startOX;
      const naturalTop    = cRect.top    - startOY;
      const naturalBottom = cRect.bottom - startOY;

      minOX = Math.round(hRect.left  - naturalLeft  + PADDING);
      maxOX = Math.round(hRect.right - naturalRight - PADDING);

      const scrollTop = host.scrollTop;
      const naturalTopScroll    = naturalTop    - hRect.top + scrollTop;
      const naturalBottomScroll = naturalBottom - hRect.top + scrollTop;
      minOY = Math.round(PADDING - naturalTopScroll);
      maxOY = Math.round(scrollTop + host.clientHeight - naturalBottomScroll - PADDING);
    }

    // float-right: marginRight = ox, but dragging left = moving image left which is
    // unintuitive with the same sign. Lock X entirely — only vertical drag matters
    // since the image is pinned to the right wall.
    // center: block elements don't benefit from horizontal shift either.
    if (wrapMode === 'float-right' || wrapMode === 'center') {
      minOX = maxOX = 0;
    }

    const onMove = (ev: MouseEvent) => {
      const newOX = Math.min(maxOX, Math.max(minOX,
        Math.round(startOX + ev.clientX - startClientX)));
      const newOY = Math.min(maxOY, Math.max(minOY,
        Math.round(startOY + ev.clientY - startClientY)));
      patch({__offsetX: newOX, __offsetY: newOY});
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <span
      ref={containerRef}
      style={{
        position: 'relative',
        display: 'inline-block',
        lineHeight: 0,
        cursor: isSelected && isDraggable ? 'move' : 'default',
      }}
      onPointerDown={(e) => {
        if (!isSelected) {
          e.stopPropagation();
          setIsSelected(true);
          lastClickTimeRef.current = Date.now();
        } else if (isDraggable) {
          const now = Date.now();
          if (now - lastClickTimeRef.current < 400) {
            startDrag(e as unknown as React.MouseEvent);
          }
          lastClickTimeRef.current = now;
        }
      }}
    >
      {/* ── Image ── */}
      <img
        src={src} alt={altText} draggable={false}
        style={{
          display: 'block',
          width:  width  ? `${width}px`  : 'auto',
          height: height ? `${height}px` : 'auto',
          maxWidth: '100%',
          transform: `rotate(${rotation}deg)`,
          outline: isSelected ? '2px solid #3b82f6' : '2px solid transparent',
          outlineOffset: 2, borderRadius: 3,
          pointerEvents: 'none',
          transition: 'outline 0.1s',
          userSelect: 'none',
        }}
      />

      {/* ── Resize handles ── */}
      {isSelected && ALL_HANDLES.map((dir) => (
        <span
          key={dir}
          style={{
            position: 'absolute', width: 10, height: 10,
            background: '#3b82f6', border: '2px solid #fff',
            borderRadius: 2, zIndex: 20,
            boxShadow: '0 1px 3px rgba(0,0,0,.35)',
            ...HANDLE_POS[dir],
          }}
          onMouseDown={(e) => startResize(e, dir)}
        />
      ))}

      {/*
        ── Layout Options trigger button ──────────────────────────────────────
        Only visible when selected. Positioned inside the image (top-right corner).
      */}
      {isSelected && (
        <button
          ref={layoutBtnRef}
          title="Layout Options"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            const opening = !showPanel;
            if (opening && layoutBtnRef.current) {
              // Compute viewport-fixed position so the panel is always fully visible
              const PANEL_W = 175;
              const PANEL_H = 200; // conservative height estimate
              const r = layoutBtnRef.current.getBoundingClientRect();
              let top  = r.bottom + 6;
              let left = r.left;
              // Clamp to viewport with 8 px gutters
              if (left + PANEL_W > window.innerWidth  - 8) left = window.innerWidth  - PANEL_W - 8;
              if (top  + PANEL_H > window.innerHeight - 8) top  = r.top - PANEL_H - 6;
              if (top  < 8) top  = 8;
              if (left < 8) left = 8;
              setPanelAnchor({top, left});
            }
            setShowPanel(opening);
          }}
          style={{
            position: 'absolute',
            top: 6, right: 6,
            width: 26, height: 26,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: showPanel ? '#3b82f6' : 'rgba(255,255,255,0.92)',
            color: showPanel ? '#ffffff' : '#374151',
            border: `1px solid ${showPanel ? '#3b82f6' : 'rgba(209,213,219,0.8)'}`,
            borderRadius: 5, cursor: 'pointer',
            boxShadow: '0 1px 4px rgba(0,0,0,.2)',
            zIndex: 30, padding: 0,
            transition: 'background .15s, color .15s, border-color .15s',
            backdropFilter: 'blur(2px)',
          }}
        >
          {/* Word-style layout icon */}
          <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
            <rect x="1" y="1" width="6" height="8" rx="1"/>
            <rect x="9" y="1" width="6" height="2" rx="1" opacity=".55"/>
            <rect x="9" y="4.5" width="6" height="2" rx="1" opacity=".55"/>
            <rect x="9" y="8" width="6" height="2" rx="1" opacity=".55"/>
            <rect x="1" y="11" width="14" height="2" rx="1" opacity=".55"/>
            <rect x="1" y="14" width="9"  height="1.5" rx=".75" opacity=".55"/>
          </svg>
        </button>
      )}

      {/*
        ── Layout Options panel ───────────────────────────────────────────────
        Uses position:fixed anchored to the layout button's viewport rect so it
        is NEVER clipped by overflow:hidden ancestors or pushed off-screen.
        The anchor is computed on open and clamped to viewport bounds.
      */}
      {isSelected && showPanel && panelAnchor && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: panelAnchor.top,
            left: panelAnchor.left,
            width: 175,
            background: '#ffffff',
            border: '1px solid #d1d5db',
            borderRadius: 8,
            boxShadow: '0 6px 24px rgba(0,0,0,.15)',
            zIndex: 9999,
            fontFamily: 'system-ui,-apple-system,sans-serif',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '7px 10px 6px',
            borderBottom: '1px solid #f3f4f6',
          }}>
            <span style={{fontSize: 11, fontWeight: 600, color: '#111827', letterSpacing: '.01em'}}>
              Layout Options
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); setShowPanel(false); }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#9ca3af', fontSize: 14, padding: '0 1px',
                lineHeight: 1, borderRadius: 3, display: 'flex',
              }}
            >✕</button>
          </div>

          <div style={{padding: '7px 10px 10px'}}>

            {/* In Line with Text */}
            <p style={{
              fontSize: 9, fontWeight: 600, color: '#6b7280',
              margin: '0 0 5px', textTransform: 'uppercase', letterSpacing: '.05em',
            }}>
              In Line with Text
            </p>
            <div style={{marginBottom: 10}}>
              <button
                title={INLINE_MODE.title}
                onClick={(e) => {
                  e.stopPropagation();
                  patch({__wrapMode: 'inline', __offsetX: 0, __offsetY: 0});
                  setShowPanel(false);
                }}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  padding: '5px 7px 4px',
                  background: wrapMode === 'inline' ? '#eff6ff' : '#f9fafb',
                  border: 'none', borderRadius: 6, cursor: 'pointer',
                  outline: wrapMode === 'inline' ? '2px solid #3b82f6' : '2px solid transparent',
                  outlineOffset: 2, transition: 'outline .12s, background .12s',
                }}
              >
                {INLINE_MODE.svg}
                <span style={{fontSize: 8, color: '#6b7280', textAlign: 'center', lineHeight: 1.2}}>
                  In Line with Text
                </span>
              </button>
            </div>

            {/* With Text Wrapping */}
            <p style={{
              fontSize: 9, fontWeight: 600, color: '#6b7280',
              margin: '0 0 5px', textTransform: 'uppercase', letterSpacing: '.05em',
            }}>
              With Text Wrapping
            </p>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5}}>
              {WRAP_MODES.map(({mode, title, label, svg}) => (
                <button
                  key={mode}
                  title={title}
                  onClick={(e) => {
                    e.stopPropagation();
                    patch({__wrapMode: mode, __offsetX: 0, __offsetY: 0});
                    setShowPanel(false);
                  }}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    padding: '5px 3px 4px',
                    background: wrapMode === mode ? '#eff6ff' : '#f9fafb',
                    border: 'none', borderRadius: 6, cursor: 'pointer',
                    outline: wrapMode === mode ? '2px solid #3b82f6' : '2px solid transparent',
                    outlineOffset: 2, transition: 'outline .12s, background .12s',
                  }}
                >
                  {svg}
                  <span style={{fontSize: 8, color: '#6b7280', textAlign: 'center', lineHeight: 1.2}}>
                    {label}
                  </span>
                </button>
              ))}
            </div>

            {/* Drag hint */}
            {isDraggable && (
              <p style={{
                fontSize: 9, color: '#9ca3af', margin: '8px 0 0',
                textAlign: 'center', lineHeight: 1.4,
              }}>
                Double-click image to drag &amp; reposition
              </p>
            )}
          </div>
        </div>
      )}

      {/*
        ── Mini bottom toolbar: Rotate Left | Rotate Right | Delete ──────────
        FIXED: miniFlipY is now correctly computed in useLayoutEffect above.
        When the image is near the bottom of the editor, the toolbar flips to
        appear ABOVE the image so it's always visible.
      */}
      {isSelected && (
        <span
          ref={miniRef}
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top:    miniFlipY ? 'auto' : '100%',
            bottom: miniFlipY ? '100%' : 'auto',
            left: '50%',
            transform: miniFlipY
              ? `translate(calc(-50% + ${miniShift}px), -8px)`
              : `translate(calc(-50% + ${miniShift}px), 8px)`,
            display: 'inline-flex', alignItems: 'center', gap: 2,
            background: '#111827',
            border: '1px solid rgba(255,255,255,.1)',
            borderRadius: 8,
            padding: '4px 6px',
            zIndex: 40,
            whiteSpace: 'nowrap',
            boxShadow: '0 6px 18px rgba(0,0,0,.4)',
          }}
        >
          {/* Rotate left */}
          <button
            title="Rotate 90° left"
            onClick={(e) => { e.stopPropagation(); patch({__rotation: ((rotation - 90) + 360) % 360}); }}
            style={miniBtnStyle}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4.5 3.5A6 6 0 1 1 2.27 8H4a.5.5 0 0 0 0-1H1.5a.5.5 0 0 0-.5.5V10a.5.5 0 0 0 1 0V8.41A7 7 0 1 0 4.5 3.5z"/>
            </svg>
          </button>

          {/* Rotate right */}
          <button
            title="Rotate 90° right"
            onClick={(e) => { e.stopPropagation(); patch({__rotation: (rotation + 90) % 360}); }}
            style={miniBtnStyle}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style={{transform: 'scaleX(-1)'}}>
              <path d="M4.5 3.5A6 6 0 1 1 2.27 8H4a.5.5 0 0 0 0-1H1.5a.5.5 0 0 0-.5.5V10a.5.5 0 0 0 1 0V8.41A7 7 0 1 0 4.5 3.5z"/>
            </svg>
          </button>

          {/* Divider */}
          <span style={{width: 1, height: 16, background: 'rgba(255,255,255,.15)', margin: '0 3px'}} />

          {/* Delete */}
          <button
            title="Delete image (or press Backspace)"
            onClick={deleteImage}
            style={{...miniBtnStyle, color: '#f87171'}}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
              <path d="M5.5 1a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 .5.5V2H5.5V1zM4 2H2a.5.5 0 0 0 0 1h.5l.812 9.351A1.5 1.5 0 0 0 4.81 13.5h6.38a1.5 1.5 0 0 0 1.498-1.149L13.5 3H14a.5.5 0 0 0 0-1h-2V1.5A1.5 1.5 0 0 0 10.5 0h-5A1.5 1.5 0 0 0 4 1.5V2zm1 0h6v-.5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0-.5.5V2zm-.312 10.149L3.88 3h8.24l-.808 9.149a.5.5 0 0 1-.499.351H4.81a.5.5 0 0 1-.122-.351z"/>
            </svg>
          </button>

          {/* Drag hint (all modes) */}
          {isDraggable && (
            <>
              <span style={{width: 1, height: 16, background: 'rgba(255,255,255,.15)', margin: '0 3px'}} />
              <span style={{fontSize: 10, color: '#6b7280', padding: '0 2px', userSelect: 'none'}}>
                double-click to drag
              </span>
            </>
          )}
        </span>
      )}
    </span>
  );
}

// ─── Shared button styles ─────────────────────────────────────────────────────

const miniBtnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'transparent', color: '#9ca3af',
  border: 'none', borderRadius: 5,
  width: 26, height: 26, cursor: 'pointer',
};

// ─── Lexical node ─────────────────────────────────────────────────────────────

export class ImageNode extends DecoratorNode<JSX.Element> {
  __src: string;
  __altText: string;
  __width: number | undefined;
  __height: number | undefined;
  __rotation: number;
  __wrapMode: WrapMode;
  __offsetX: number;
  __offsetY: number;

  static getType(): string { return 'image'; }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      node.__src, node.__altText, node.__width, node.__height,
      node.__rotation, node.__wrapMode, node.__offsetX, node.__offsetY, node.__key,
    );
  }

  constructor(
    src: string, altText: string,
    width?: number, height?: number,
    rotation = 0, wrapMode: WrapMode = 'inline',
    offsetX = 0, offsetY = 0, key?: NodeKey,
  ) {
    super(key);
    this.__src = src; this.__altText = altText;
    this.__width = width; this.__height = height;
    this.__rotation = rotation; this.__wrapMode = wrapMode;
    this.__offsetX = offsetX; this.__offsetY = offsetY;
  }

  static importJSON(s: SerializedImageNode): ImageNode {
    return new ImageNode(
      s.src, s.altText, s.width, s.height,
      s.rotation ?? 0, s.wrapMode ?? 'inline', s.offsetX ?? 0, s.offsetY ?? 0,
    );
  }

  exportJSON(): SerializedImageNode {
    return {
      type: 'image', version: 1,
      src: this.__src, altText: this.__altText,
      width: this.__width, height: this.__height,
      rotation: this.__rotation, wrapMode: this.__wrapMode,
      offsetX: this.__offsetX, offsetY: this.__offsetY,
    };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      img: () => ({
        conversion: (domNode) => {
          if (domNode instanceof HTMLImageElement)
            return {node: $createImageNode(domNode.src, domNode.alt)};
          return null;
        },
        priority: 0,
      }),
    };
  }

  exportDOM(): DOMExportOutput {
    const img = document.createElement('img');
    img.src = this.__src; img.alt = this.__altText;
    if (this.__width)  img.width  = this.__width;
    if (this.__height) img.height = this.__height;
    img.style.maxWidth = '100%';
    if (this.__rotation) img.style.transform = `rotate(${this.__rotation}deg)`;
    if (this.__wrapMode === 'float-left') {
      img.style.float = 'left'; img.style.marginRight = '12px'; img.style.marginBottom = '8px';
    } else if (this.__wrapMode === 'float-right') {
      img.style.float = 'right'; img.style.marginLeft = '12px'; img.style.marginBottom = '8px';
    } else if (this.__wrapMode === 'center') {
      img.style.display = 'block'; img.style.margin = '4px auto';
    }
    return {element: img};
  }

  _applyContainerStyles(el: HTMLElement): void {
    const ox = this.__offsetX ?? 0;
    const oy = this.__offsetY ?? 0;

    // ── Full reset ────────────────────────────────────────────────────────────
    el.style.float        = '';
    el.style.position     = '';
    el.style.zIndex       = '';
    el.style.left         = '';
    el.style.top          = '';
    el.style.marginRight  = '';
    el.style.marginLeft   = '';
    el.style.marginTop    = '';   // <── explicit reset (was missing before)
    el.style.marginBottom = '';
    el.style.textAlign    = '';
    el.style.margin       = '';

    // ── Mode-specific styles ──────────────────────────────────────────────────
    // NOTE: offsetX / offsetY are applied via CSS *margins* (not transform) so
    // that surrounding text actually reflows as the image is dragged. CSS
    // transform is visual-only and does not affect layout, which caused text to
    // stay put while the image moved on top of it.

    if (this.__wrapMode === 'float-left') {
      el.style.float        = 'left';
      // ox shifts the float right from the left wall; oy shifts it down.
      el.style.marginLeft   = `${Math.max(0, ox)}px`;
      el.style.marginTop    = `${Math.max(0, oy)}px`;
      el.style.marginRight  = '12px';
      el.style.marginBottom = '8px';
    } else if (this.__wrapMode === 'float-right') {
      el.style.float        = 'right';
      // For float-right, ox represents distance pushed from the right wall.
      // Positive ox → more marginRight → image moves left toward content. ✓
      el.style.marginRight  = `${Math.max(0, ox)}px`;
      el.style.marginTop    = `${Math.max(0, oy)}px`;
      el.style.marginLeft   = '12px';
      el.style.marginBottom = '8px';
    } else if (this.__wrapMode === 'center') {
      el.style.display      = 'block';
      el.style.textAlign    = 'center';
      // oy shifts the block down so text above/below reflows correctly.
      el.style.marginTop    = `${Math.max(0, oy) + 4}px`;
      el.style.marginBottom = '4px';
    }
    // inline: no extra styles beyond the default display:inline-block
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const span = document.createElement('span');
    span.style.display = 'inline-block';
    this._applyContainerStyles(span);
    return span;
  }

  updateDOM(prevNode: ImageNode, dom: HTMLElement): boolean {
    const changed =
      prevNode.__wrapMode !== this.__wrapMode ||
      prevNode.__offsetX  !== this.__offsetX  ||
      prevNode.__offsetY  !== this.__offsetY;

    if (changed) {
      // cssText reset clears all inline styles (including any stale marginTop).
      dom.style.cssText = 'display: inline-block;';
      this._applyContainerStyles(dom);
    }
    return false;
  }

  // ─── FIX: isInline() now returns true ────────────────────────────────────
  //
  // Previously this returned `false`, making Lexical treat the ImageNode as a
  // block-level element (like a paragraph). That meant:
  //   • No text could live on the same line as the image.
  //   • Clicking left of the image in "inline" mode had nowhere to put a cursor.
  //   • "Centre" mode was equally inaccessible — text above/below worked, but
  //     cursor placement before the image was unintuitive.
  //
  // With `true`, the node is an inline character in the Lexical AST, exactly
  // like Word's "In Line with Text" object. The visual layout differences
  // (float, centre) are purely CSS — they do not need the Lexical "block" slot.
  //
  //   inline     → display:inline-block; no float → cursor before/after ✓
  //   float-left → float:left CSS; text wraps around in same paragraph ✓
  //   float-right→ float:right CSS; same ✓
  //   center     → display:block; margin:auto → browser creates anonymous
  //                block boxes; image appears centred on its own visual line ✓
  isInline(): true { return true; }

  decorate(): JSX.Element {
    return (
      <ImageComponent
        src={this.__src} altText={this.__altText}
        width={this.__width} height={this.__height}
        rotation={this.__rotation} wrapMode={this.__wrapMode}
        offsetX={this.__offsetX} offsetY={this.__offsetY}
        nodeKey={this.__key}
      />
    );
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function $createImageNode(src: string, altText = '', width?: number, height?: number): ImageNode {
  return new ImageNode(src, altText, width, height, 0, 'inline');
}

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
  return node instanceof ImageNode;
}
