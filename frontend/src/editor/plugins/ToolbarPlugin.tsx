/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * CHANGES in this version:
 *  • Bullet-list button split into [icon | ▾] — the chevron opens a dropdown
 *    to choose disc / circle / square / none.
 *  • Numbered-list button split into [icon | ▾] — the chevron opens a dropdown
 *    to choose decimal / lower-alpha / upper-alpha / lower-roman / upper-roman.
 *  • Dropdowns use position:fixed so they are never clipped by the toolbar's
 *    overflow-x:auto scroll container.
 *  • $updateToolbar reads the list node's __listStyleType so the active style
 *    is highlighted in the dropdown when the cursor moves into a list.
 *
 * FIX [LIST STYLES — Issue 3]:
 *  After setting __listStyleType on the writable ListNode, Lexical may or may not
 *  apply list-style-type to the real DOM depending on the installed version of
 *  @lexical/list. A registerMutationListener for ListNode is added: whenever any
 *  ListNode is created or updated, it reads __listStyleType from the current editor
 *  state and writes dom.style.listStyleType directly. Inline styles have higher
 *  CSS specificity than the Tailwind theme classes (list-disc / list-decimal), so
 *  this reliably overrides the default without touching the theme.
 *
 * FIX [UNDO / REDO PLACEMENT — Issue 4]:
 *  Undo and Redo buttons have been moved from between "Font Size" and "Bold" to the
 *  far-right end of the toolbar. A flex-1 spacer div is inserted before them so they
 *  are always pushed to the trailing edge on any viewport width. All other buttons
 *  remain in their original order on the left side.
 */

import {
  $isListNode,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListNode,
  REMOVE_LIST_COMMAND,
} from '@lexical/list';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode,
} from '@lexical/rich-text';
import {$patchStyleText, $setBlocksType} from '@lexical/selection';
import {$findMatchingParent, $getNearestNodeOfType, mergeRegister} from '@lexical/utils';
import {
  $createParagraphNode,
  $getNodeByKey,
  $getSelection,
  $isRangeSelection,
  $isRootOrShadowRoot,
  $isTextNode,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_LOW,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  LexicalEditor,
  REDO_COMMAND,
  TextNode,
  UNDO_COMMAND,
} from 'lexical';
import React, {useCallback, useEffect, useRef, useState} from 'react';

import { $createImageNode } from "../ImageNode";

// ─── Constants ────────────────────────────────────────────────────────────────

const BLOCK_TYPES = [
  {label: 'Normal', value: 'paragraph'},
  {label: 'Heading 1', value: 'h1'},
  {label: 'Heading 2', value: 'h2'},
  {label: 'Heading 3', value: 'h3'},
  {label: 'Quote', value: 'quote'},
];

const FONT_SIZES = ['12', '14', '16', '18', '20', '24', '28', '32', '36', '48'];

const FONT_FAMILIES = [
  {label: 'Default', value: ''},
  {label: 'Arial', value: 'Arial'},
  {label: 'Courier New', value: 'Courier New'},
  {label: 'Georgia', value: 'Georgia'},
  {label: 'Times New Roman', value: 'Times New Roman'},
  {label: 'Trebuchet MS', value: 'Trebuchet MS'},
  {label: 'Verdana', value: 'Verdana'},
];

// List style options ───────────────────────────────────────────────────────────

const BULLET_STYLES: {label: string; value: string; symbol: string}[] = [
  {label: 'Disc',   value: 'disc',   symbol: '●'},
  {label: 'Circle', value: 'circle', symbol: '○'},
  {label: 'Square', value: 'square', symbol: '■'},
  {label: 'None',   value: 'none',   symbol: '—'},
];

const NUMBER_STYLES: {label: string; value: string; symbol: string}[] = [
  {label: '1, 2, 3',    value: 'decimal',    symbol: '1.'},
  {label: 'a, b, c',    value: 'lower-alpha', symbol: 'a.'},
  {label: 'A, B, C',    value: 'upper-alpha', symbol: 'A.'},
  {label: 'i, ii, iii', value: 'lower-roman', symbol: 'i.'},
  {label: 'I, II, III', value: 'upper-roman', symbol: 'I.'},
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatParagraph(editor: LexicalEditor) {
  editor.update(() => {
    const selection = $getSelection();
    $setBlocksType(selection, () => $createParagraphNode());
  });
}

function formatHeading(editor: LexicalEditor, headingTag: 'h1' | 'h2' | 'h3') {
  editor.update(() => {
    const selection = $getSelection();
    $setBlocksType(selection, () => $createHeadingNode(headingTag));
  });
}

function formatQuote(editor: LexicalEditor) {
  editor.update(() => {
    const selection = $getSelection();
    $setBlocksType(selection, () => $createQuoteNode());
  });
}

function applyBlockType(
  editor: LexicalEditor,
  type: string,
  currentBlockType: string,
) {
  if (type === 'paragraph') {
    formatParagraph(editor);
  } else if (type === 'quote') {
    formatQuote(editor);
  } else if (type === 'bullet') {
    if (currentBlockType === 'bullet') {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    }
  } else if (type === 'number') {
    if (currentBlockType === 'number') {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    }
  } else {
    formatHeading(editor, type as 'h1' | 'h2' | 'h3');
  }
}

function maskStyle(url: string): React.CSSProperties {
  return {
    WebkitMaskImage: `url('${url}')`,
    WebkitMaskPosition: 'center',
    WebkitMaskRepeat: 'no-repeat',
    WebkitMaskSize: 'contain',
    maskImage: `url('${url}')`,
    maskPosition: 'center',
    maskRepeat: 'no-repeat',
    maskSize: 'contain',
  };
}

function Divider() {
  return (
    <div className="mx-1 w-px self-stretch bg-zinc-200 dark:bg-zinc-600" />
  );
}

// ─── List Style Dropdown ──────────────────────────────────────────────────────
//
// Uses position:fixed anchored to the trigger button's bounding rect so it is
// never clipped by the toolbar's overflow-x:auto scroll container.

interface ListStyleDropdownProps {
  items: {label: string; value: string; symbol: string}[];
  activeStyle: string;
  /** Bounding rect of the trigger button — used to position the dropdown. */
  anchorRect: DOMRect;
  onSelect: (value: string) => void;
  onClose: () => void;
}

function ListStyleDropdown({
  items, activeStyle, anchorRect, onSelect, onClose,
}: ListStyleDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    // Use a slight delay so the triggering click doesn't immediately close us
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener('mousedown', handler);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        top: anchorRect.bottom + 4,
        left: anchorRect.left,
        zIndex: 9999,
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        boxShadow: '0 4px 24px rgba(0,0,0,.15)',
        padding: '4px',
        minWidth: 160,
        fontFamily: 'system-ui,-apple-system,sans-serif',
      }}
    >
      {items.map(({label, value, symbol}) => {
        const isActive = activeStyle === value;
        return (
          <button
            key={value}
            // onMouseDown + preventDefault keeps the editor focused
            onMouseDown={(e) => {
              e.preventDefault();
              onSelect(value);
              onClose();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              width: '100%',
              padding: '7px 10px',
              background: isActive ? '#eff6ff' : 'transparent',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 13,
              color: '#374151',
              textAlign: 'left',
            }}
          >
            {/* Style preview symbol */}
            <span style={{
              width: 22,
              textAlign: 'center',
              fontSize: 15,
              color: isActive ? '#3b82f6' : '#6b7280',
              fontWeight: isActive ? 700 : 400,
              flexShrink: 0,
            }}>
              {symbol}
            </span>

            {/* Style label */}
            <span style={{flex: 1, color: isActive ? '#1d4ed8' : '#374151'}}>
              {label}
            </span>

            {/* Active checkmark */}
            {isActive && (
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path
                  d="M2 6.5L5.5 10L11 3"
                  stroke="#3b82f6" strokeWidth="1.8"
                  strokeLinecap="round" strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const toolbarRef    = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Refs for the list trigger groups (used to measure anchor rect)
  const bulletGroupRef = useRef<HTMLDivElement>(null);
  const numberGroupRef = useRef<HTMLDivElement>(null);

  // ── Pending inline styles ref (applied to next typed TextNode) ────────────
  const pendingStylesRef   = useRef<Record<string, string>>({});
  const applyingPendingRef = useRef(false);

  const [canUndo,         setCanUndo]         = useState(false);
  const [canRedo,         setCanRedo]         = useState(false);
  const [blockType,       setBlockType]       = useState('paragraph');
  const [isBold,          setIsBold]          = useState(false);
  const [isItalic,        setIsItalic]        = useState(false);
  const [isUnderline,     setIsUnderline]     = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [fontSize,        setFontSize]        = useState('16');
  const [fontFamily,      setFontFamily]      = useState('');

  // Active list style (tracked per type so each dropdown shows the right selection)
  const [bulletListStyle, setBulletListStyle] = useState('disc');
  const [numberListStyle, setNumberListStyle] = useState('decimal');

  // Dropdown anchor rects — non-null means the dropdown is open
  const [bulletDropdownRect, setBulletDropdownRect] = useState<DOMRect | null>(null);
  const [numberDropdownRect, setNumberDropdownRect] = useState<DOMRect | null>(null);

  // ── Toolbar state sync ────────────────────────────────────────────────────

  const $updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return;

    // Text format
    setIsBold(selection.hasFormat('bold'));
    setIsItalic(selection.hasFormat('italic'));
    setIsUnderline(selection.hasFormat('underline'));
    setIsStrikethrough(selection.hasFormat('strikethrough'));

    // Font styles — read from the anchor text node's inline style
    const anchorNode = selection.anchor.getNode();
    const rawStyle: string =
      typeof (anchorNode as any).getStyle === 'function'
        ? (anchorNode as any).getStyle()
        : '';

    if (!pendingStylesRef.current['font-size']) {
      const sizeMatch = rawStyle.match(/font-size:\s*(\d+)px/);
      setFontSize(sizeMatch ? sizeMatch[1] : '16');
    }

    if (!pendingStylesRef.current['font-family']) {
      const familyMatch = rawStyle.match(/font-family:\s*([^;]+)/);
      setFontFamily(familyMatch ? familyMatch[1].trim() : '');
    }

    // Block type
    let topLevelElement = $findMatchingParent(anchorNode, (e) => {
      const parent = e.getParent();
      return parent !== null && $isRootOrShadowRoot(parent);
    });
    if (topLevelElement === null) {
      topLevelElement = anchorNode.getTopLevelElementOrThrow();
    }

    if ($isListNode(topLevelElement)) {
      const parentList = $getNearestNodeOfType<ListNode>(anchorNode, ListNode);
      const activeList = parentList ?? topLevelElement;
      const listType   = activeList.getListType();

      // Read __listStyleType (Lexical internal; may be '' when not explicitly set)
      const rawStyleType: string = (activeList as any).__listStyleType ?? '';
      const resolvedStyle = rawStyleType || (listType === 'bullet' ? 'disc' : 'decimal');

      setBlockType(listType === 'bullet' ? 'bullet' : 'number');
      if (listType === 'bullet') setBulletListStyle(resolvedStyle);
      else                       setNumberListStyle(resolvedStyle);
    } else if ($isHeadingNode(topLevelElement)) {
      setBlockType(topLevelElement.getTag());
    } else {
      setBlockType(topLevelElement.getType());
    }
  }, []);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({editorState}) => {
        editorState.read(() => {
          $updateToolbar();
        }, {editor});
      }),
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload) => { setCanUndo(payload); return false; },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (payload) => { setCanRedo(payload); return false; },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [editor, $updateToolbar]);

  // ── Mutation listener: apply pending inline styles to new TextNodes ────────
  useEffect(() => {
    return editor.registerMutationListener(TextNode, (mutatedNodes) => {
      const pending = pendingStylesRef.current;
      if (!Object.keys(pending).length || applyingPendingRef.current) return;

      applyingPendingRef.current = true;
      editor.update(
        () => {
          for (const [key] of mutatedNodes) {
            const node = $getNodeByKey(key);
            if (!$isTextNode(node)) continue;

            const currentStyle = (node as TextNode).getStyle();
            let newStyle = currentStyle;
            for (const [prop, val] of Object.entries(pending)) {
              const escaped = prop.replace(/[-]/g, '\\$&');
              if (!new RegExp(escaped + '\\s*:').test(newStyle)) {
                newStyle += ` ${prop}: ${val};`;
              }
            }
            if (newStyle !== currentStyle) {
              (node as TextNode).setStyle(newStyle.trim());
            }
          }
        },
        {
          onUpdate: () => {
            applyingPendingRef.current = false;
            pendingStylesRef.current = {};
          },
        },
      );
    });
  }, [editor]);

  // ── FIX [Issue 3]: Mutation listener — apply list-style-type to DOM ────────
  //
  // Lexical's ListNode.updateDOM may not apply __listStyleType as a DOM inline
  // style in all package versions. After every ListNode creation or update we
  // read __listStyleType from the current editor state and write it directly to
  // dom.style.listStyleType. Inline styles beat the Tailwind theme classes
  // (list-disc / list-decimal) so all custom styles are correctly visible.
  //
  // This listener also covers lists created via markdown shortcuts or the Insert
  // commands — not just those triggered by the style picker dropdown.
  useEffect(() => {
    return editor.registerMutationListener(ListNode, (mutatedNodes) => {
      const editorState = editor.getEditorState();
      for (const [key, mutation] of mutatedNodes) {
        if (mutation === 'destroyed') continue;

        // Read the node's __listStyleType from the current state
        let listStyleType = '';
        editorState.read(() => {
          const node = $getNodeByKey(key);
          if ($isListNode(node)) {
            listStyleType = (node as any).__listStyleType ?? '';
          }
        });

        // Only apply when a custom style has been set (don't override defaults
        // like disc/decimal that the theme class already provides for free)
        if (listStyleType) {
          const dom = editor.getElementByKey(key);
          if (dom instanceof HTMLElement) {
            dom.style.listStyleType = listStyleType;
          }
        }
      }
    });
  }, [editor]);

  // ── Font size ─────────────────────────────────────────────────────────────

  const applyFontSize = (size: string) => {
    setFontSize(size);
    pendingStylesRef.current['font-size'] = `${size}px`;

    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      $patchStyleText(selection, {'font-size': `${size}px`});
      if (!selection.isCollapsed()) {
        delete pendingStylesRef.current['font-size'];
      }
    });
  };

  // ── Font family ───────────────────────────────────────────────────────────

  const applyFontFamily = (family: string) => {
    setFontFamily(family);

    if (family) {
      pendingStylesRef.current['font-family'] = family;
    } else {
      delete pendingStylesRef.current['font-family'];
    }

    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      $patchStyleText(selection, {'font-family': family || null});
      if (!selection.isCollapsed()) {
        delete pendingStylesRef.current['font-family'];
      }
    });
  };

  // ── List style application ────────────────────────────────────────────────
  //
  // When the desired list type is NOT currently active we dispatch the insert
  // command first, then apply the style in a rAF so the list node exists.
  // When the list IS already active we can patch the style immediately.
  //
  // FIX [Issue 3]: After setting __listStyleType via Lexical's write API, we
  // also apply dom.style.listStyleType directly in the onUpdate callback. This
  // guarantees the style takes effect regardless of whether the installed version
  // of @lexical/list reads __listStyleType inside its own updateDOM.

  const applyListStyle = (listType: 'bullet' | 'number', styleType: string) => {
    // Update local tracking immediately (optimistic)
    if (listType === 'bullet') setBulletListStyle(styleType);
    else                       setNumberListStyle(styleType);

    const isCurrentListType = blockType === listType;

    const patchStyle = () => {
      // Capture the node key so we can apply the DOM style in onUpdate,
      // which runs AFTER Lexical has reconciled the AST → DOM.
      let capturedKey: string | null = null;

      editor.update(
        () => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) return;
          const anchorNode = selection.anchor.getNode();
          const listNode   = $getNearestNodeOfType<ListNode>(anchorNode, ListNode);
          if (listNode) {
            capturedKey = listNode.getKey();
            // __listStyleType is an internal Lexical ListNode property.
            // Setting it here triggers updateDOM which applies list-style-type
            // in versions of @lexical/list that support it.
            (listNode.getWritable() as any).__listStyleType = styleType;
          }
        },
        {
          onUpdate: () => {
            // Belt-and-suspenders: apply inline DOM style directly so the
            // visual update is guaranteed even on older @lexical/list versions.
            if (capturedKey !== null) {
              const dom = editor.getElementByKey(capturedKey);
              if (dom instanceof HTMLElement) {
                dom.style.listStyleType = styleType;
              }
            }
          },
        },
      );
    };

    if (isCurrentListType) {
      // List already exists — patch style right away
      patchStyle();
    } else {
      // Insert list first, then patch on the next animation frame
      const cmd = listType === 'bullet'
        ? INSERT_UNORDERED_LIST_COMMAND
        : INSERT_ORDERED_LIST_COMMAND;
      editor.dispatchCommand(cmd, undefined);
      requestAnimationFrame(patchStyle);
    }
  };

  // ── Image insert ──────────────────────────────────────────────────────────

  const insertImageFromFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const imageNode = $createImageNode(src, file.name);
          selection.insertNodes([imageNode]);

          const nextSibling = imageNode.getNextSibling();
          if (nextSibling) {
            if (typeof (nextSibling as any).selectStart === 'function') {
              (nextSibling as any).selectStart();
            }
          } else {
            const para = $createParagraphNode();
            imageNode.insertAfter(para);
            para.selectStart();
          }
        }
      });
      setTimeout(() => editor.focus(), 0);
    };
    reader.readAsDataURL(file);
  };

  // ── Styles ────────────────────────────────────────────────────────────────

  const btnBase =
    'group flex cursor-pointer items-center justify-center rounded-md border-0 p-1.5 transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500';
  const btnInactive =
    'bg-transparent text-zinc-700 enabled:hover:bg-zinc-200 dark:text-zinc-200 dark:enabled:hover:bg-zinc-700';
  const btnActive =
    'bg-blue-500 text-white enabled:hover:bg-blue-600 dark:bg-blue-600 dark:enabled:hover:bg-blue-700';
  const iconBase =
    'flex h-[18px] w-[18px] shrink-0 bg-current group-hover:opacity-100';

  const selectCls =
    'cursor-pointer appearance-none rounded-md border border-solid border-transparent bg-transparent px-2 py-1 text-sm font-medium text-zinc-700 transition-colors duration-150 hover:bg-zinc-200 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 dark:text-zinc-200 dark:hover:bg-zinc-700';

  // Small chevron SVG shown on the dropdown trigger arrow buttons
  const ChevronDown = () => (
    <svg width="7" height="5" viewBox="0 0 7 5" fill="currentColor" aria-hidden>
      <path d="M0 0.5L3.5 4.5L7 0.5H0Z"/>
    </svg>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  //
  // FIX [Issue 4 — Undo/Redo placement]:
  //   • Undo/Redo have been REMOVED from between "Font Size" and "Bold".
  //   • A flex-1 spacer is placed after the Image Upload button.
  //   • Undo/Redo are now rendered AFTER the spacer, which pushes them to the
  //     far-right end on every viewport width.
  //   • All other buttons remain in their original left-to-right order.

  return (
    <div
      className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 overflow-x-auto border-b [border-bottom-style:solid] border-b-black/10 bg-zinc-50 px-2 py-1.5 md:justify-evenly dark:border-b-white/10 dark:bg-zinc-800"
      ref={toolbarRef}>

      {/* Block type */}
      <select
        className={selectCls}
        value={blockType}
        onChange={(e) => applyBlockType(editor, e.target.value, blockType)}
        aria-label="Block type"
        title="Style">
        {BLOCK_TYPES.map(({label, value}) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>

      <Divider />

      {/* Font family */}
      <select
        className={selectCls}
        value={fontFamily}
        onChange={(e) => applyFontFamily(e.target.value)}
        aria-label="Font family"
        title="Font">
        {FONT_FAMILIES.map(({label, value}) => (
          <option key={value} value={value} style={value ? {fontFamily: value} : undefined}>
            {label}
          </option>
        ))}
      </select>

      <Divider />

      {/* Font size */}
      <select
        className={selectCls}
        value={fontSize}
        onChange={(e) => applyFontSize(e.target.value)}
        aria-label="Font size"
        title="Font size">
        {FONT_SIZES.map((s) => (
          <option key={s} value={s}>{s}px</option>
        ))}
      </select>

      <Divider />

      {/* Bold / Italic / Underline / Strikethrough */}
      <button
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
        className={`${btnBase} mr-0.5 ${isBold ? btnActive : btnInactive}`}
        aria-label="Format Bold"
        aria-pressed={isBold}
        title="Bold (Ctrl + B)">
        <i className={`${iconBase} ${isBold ? 'opacity-100' : 'opacity-70'}`} style={maskStyle('/img/bold.svg')} />
      </button>
      <button
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
        className={`${btnBase} mr-0.5 ${isItalic ? btnActive : btnInactive}`}
        aria-label="Format Italics"
        aria-pressed={isItalic}
        title="Italics (Ctrl + I)">
        <i className={`${iconBase} ${isItalic ? 'opacity-100' : 'opacity-70'}`} style={maskStyle('/img/italic.svg')} />
      </button>
      <button
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}
        className={`${btnBase} mr-0.5 ${isUnderline ? btnActive : btnInactive}`}
        aria-label="Format Underline"
        aria-pressed={isUnderline}
        title="Underline (Ctrl + U)">
        <i className={`${iconBase} ${isUnderline ? 'opacity-100' : 'opacity-70'}`} style={maskStyle('/img/underline.svg')} />
      </button>
      <button
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')}
        className={`${btnBase} mr-0.5 ${isStrikethrough ? btnActive : btnInactive}`}
        aria-label="Format Strikethrough"
        aria-pressed={isStrikethrough}
        title="Strikethrough">
        <i className={`${iconBase} ${isStrikethrough ? 'opacity-100' : 'opacity-70'}`} style={maskStyle('/img/strikethrough.svg')} />
      </button>

      <Divider />

      {/*
        ── Bullet list [icon | ▾] ──────────────────────────────────────────────
        Left part: toggle bullet list on/off (using the last chosen style).
        Right part (chevron): open style picker dropdown.
      */}
      <div
        ref={bulletGroupRef}
        style={{display: 'flex', alignItems: 'stretch', borderRadius: 6, overflow: 'hidden'}}
      >
        {/* Main toggle button */}
        <button
          onClick={() => {
            if (blockType === 'bullet') {
              editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
            } else {
              applyListStyle('bullet', bulletListStyle);
            }
          }}
          className={`${btnBase} ${blockType === 'bullet' ? btnActive : btnInactive}`}
          style={{borderRadius: '6px 0 0 6px', paddingRight: 5}}
          aria-label="Bullet List"
          aria-pressed={blockType === 'bullet'}
          title={`Bullet List (${bulletListStyle})`}>
          <i
            className={`${iconBase} ${blockType === 'bullet' ? 'opacity-100' : 'opacity-70'}`}
            style={maskStyle('/img/unordered-list.svg')}
          />
        </button>

        {/* Dropdown trigger */}
        <button
          onClick={() => {
            const rect = bulletGroupRef.current?.getBoundingClientRect() ?? null;
            setBulletDropdownRect(prev => prev ? null : rect);
            setNumberDropdownRect(null); // close the other one
          }}
          className={`${btnBase} ${blockType === 'bullet' ? btnActive : btnInactive}`}
          style={{
            borderRadius: '0 6px 6px 0',
            borderLeft: '1px solid rgba(0,0,0,.08)',
            padding: '4px 4px',
            minWidth: 16,
          }}
          aria-label="Bullet list style"
          title="Choose bullet style">
          <ChevronDown />
        </button>
      </div>

      {/*
        ── Numbered list [icon | ▾] ────────────────────────────────────────────
      */}
      <div
        ref={numberGroupRef}
        style={{display: 'flex', alignItems: 'stretch', borderRadius: 6, overflow: 'hidden'}}
      >
        {/* Main toggle button */}
        <button
          onClick={() => {
            if (blockType === 'number') {
              editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
            } else {
              applyListStyle('number', numberListStyle);
            }
          }}
          className={`${btnBase} ${blockType === 'number' ? btnActive : btnInactive}`}
          style={{borderRadius: '6px 0 0 6px', paddingRight: 5}}
          aria-label="Numbered List"
          aria-pressed={blockType === 'number'}
          title={`Numbered List (${numberListStyle})`}>
          <i
            className={`${iconBase} ${blockType === 'number' ? 'opacity-100' : 'opacity-70'}`}
            style={maskStyle('/img/ordered-list.svg')}
          />
        </button>

        {/* Dropdown trigger */}
        <button
          onClick={() => {
            const rect = numberGroupRef.current?.getBoundingClientRect() ?? null;
            setNumberDropdownRect(prev => prev ? null : rect);
            setBulletDropdownRect(null); // close the other one
          }}
          className={`${btnBase} ${blockType === 'number' ? btnActive : btnInactive}`}
          style={{
            borderRadius: '0 6px 6px 0',
            borderLeft: '1px solid rgba(0,0,0,.08)',
            padding: '4px 4px',
            minWidth: 16,
          }}
          aria-label="Number list style"
          title="Choose number style">
          <ChevronDown />
        </button>
      </div>

      {/* Bullet style dropdown (position:fixed, never clipped by toolbar) */}
      {bulletDropdownRect && (
        <ListStyleDropdown
          items={BULLET_STYLES}
          activeStyle={bulletListStyle}
          anchorRect={bulletDropdownRect}
          onSelect={(val) => applyListStyle('bullet', val)}
          onClose={() => setBulletDropdownRect(null)}
        />
      )}

      {/* Number style dropdown */}
      {numberDropdownRect && (
        <ListStyleDropdown
          items={NUMBER_STYLES}
          activeStyle={numberListStyle}
          anchorRect={numberDropdownRect}
          onSelect={(val) => applyListStyle('number', val)}
          onClose={() => setNumberDropdownRect(null)}
        />
      )}

      <Divider />

      {/* Alignment */}
      <button
        onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left')}
        className={`${btnBase} ${btnInactive} mr-0.5`}
        aria-label="Left Align"
        title="Left Align">
        <i className={`${iconBase} opacity-70`} style={maskStyle('/img/text-align-start.svg')} />
      </button>
      <button
        onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center')}
        className={`${btnBase} ${btnInactive} mr-0.5`}
        aria-label="Center Align"
        title="Center">
        <i className={`${iconBase} opacity-70`} style={maskStyle('/img/text-align-center.svg')} />
      </button>
      <button
        onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right')}
        className={`${btnBase} ${btnInactive} mr-0.5`}
        aria-label="Right Align"
        title="Right Align">
        <i className={`${iconBase} opacity-70`} style={maskStyle('/img/text-align-end.svg')} />
      </button>
      <button
        onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify')}
        className={`${btnBase} ${btnInactive} mr-0.5`}
        aria-label="Justify Align"
        title="Justify">
        <i className={`${iconBase} opacity-70`} style={maskStyle('/img/text-align-justify.svg')} />
      </button>

      <Divider />

      {/* Image upload */}
      <button
        onClick={() => imageInputRef.current?.click()}
        className={`${btnBase} ${btnInactive}`}
        aria-label="Insert Image"
        title="Insert Image">
        <i className={`${iconBase} opacity-70`} style={maskStyle('/img/image-upload.svg')} />
      </button>
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) insertImageFromFile(file);
          e.target.value = '';
        }}
      />

      {/*
        ── Spacer + Undo / Redo (far right) ───────────────────────────────────
        flex-1 fills all remaining horizontal space, pushing the Undo/Redo
        buttons to the trailing edge of the toolbar on every viewport width.
        On narrow screens where the toolbar wraps onto multiple rows, the spacer
        still ensures Undo/Redo stay at the end of their own row.
      */}
      <div className="flex-1" />

      <Divider />

      <button
        disabled={!canUndo}
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
        className={`${btnBase} ${btnInactive} mr-0.5`}
        aria-label="Undo"
        title="Undo (Ctrl + Z)">
        <i className={`${iconBase} opacity-70`} style={maskStyle('/img/undo.svg')} />
      </button>
      <button
        disabled={!canRedo}
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
        className={`${btnBase} ${btnInactive}`}
        aria-label="Redo"
        title="Redo (Ctrl + Y)">
        <i className={`${iconBase} opacity-70`} style={maskStyle('/img/redo.svg')} />
      </button>

    </div>
  );
}
