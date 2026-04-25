import {useEffect} from 'react';

import {TabIndentationExtension} from '@lexical/extension';
import {HistoryExtension} from '@lexical/history';
import {$generateHtmlFromNodes, $generateNodesFromDOM} from '@lexical/html';
import {
  $createListNode,
  $createListItemNode,
  $isListNode,
  ListNode,
  ListItemNode,
} from '@lexical/list';

import {$getRoot} from 'lexical';

import {ListPlugin} from '@lexical/react/LexicalListPlugin';
import {ContentEditable} from '@lexical/react/LexicalContentEditable';
import {LexicalExtensionComposer} from '@lexical/react/LexicalExtensionComposer';
import {OnChangePlugin} from '@lexical/react/LexicalOnChangePlugin';
import {MarkdownShortcutPlugin} from '@lexical/react/LexicalMarkdownShortcutPlugin';
import {RichTextExtension} from '@lexical/rich-text';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';

import {
  ORDERED_LIST,
  UNORDERED_LIST,
  type ElementTransformer,
} from '@lexical/markdown';

import {defineExtension} from 'lexical';

import {ImageNode} from './ImageNode';
import {ToolbarPlugin} from './plugins/ToolbarPlugin';

const ALPHA_ORDERED_LIST: ElementTransformer = {
  dependencies: [ListNode, ListItemNode],
  export: () => null,
  regExp: /^[a-z]\.\s/,
  replace: (parentNode, children) => {
    const previousNode = parentNode.getPreviousSibling();

    if ($isListNode(previousNode)) {
      const listItem = $createListItemNode();
      children.forEach((child) => listItem.append(child));
      previousNode.append(listItem);
      parentNode.remove();
    } else {
      const list = $createListNode('number', 1);
      const listItem = $createListItemNode();
      children.forEach((child) => listItem.append(child));
      list.append(listItem);
      parentNode.replace(list);
    }
  },
  type: 'element',
};

const LIST_TRANSFORMERS = [
  ALPHA_ORDERED_LIST,
  ORDERED_LIST,
  UNORDERED_LIST,
];

const landingHeroExtension = defineExtension({
  dependencies: [
    RichTextExtension,
    HistoryExtension,
    TabIndentationExtension,
  ],
  name: 'editor',
  namespace: 'editor',
  nodes: [ListNode, ListItemNode, ImageNode],
});

interface EditorProps {
  onUpdate?: (html: string) => void;
  initialHtml?: string;
}

export default function Editor({
  onUpdate,
  initialHtml,
}: EditorProps) {
  return (
    <LexicalExtensionComposer
      extension={landingHeroExtension}
      contentEditable={null}
    >
      <div className="flex w-full flex-col overflow-hidden rounded-2xl border border-black/10 dark:border-white/10">
        <ToolbarPlugin />

        <ContentEditable
          className="relative min-h-[320px] overflow-y-auto overflow-x-hidden p-4 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          aria-label="Rich text editor"
          placeholder={null}
        />
      </div>

      <ListPlugin />
      <MarkdownShortcutPlugin transformers={LIST_TRANSFORMERS} />

      {initialHtml && <LoadInitialHtml html={initialHtml} />}

      {onUpdate && (
        <OnChangePlugin
          onChange={(editorState, editor) => {
            editorState.read(() => {
              const html =
                $generateHtmlFromNodes(editor, null);
              onUpdate(html);
            });
          }}
        />
      )}
    </LexicalExtensionComposer>
  );
}

function LoadInitialHtml({
  html,
}: {
  html: string;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    editor.update(() => {
      const parser = new DOMParser();
      const dom = parser.parseFromString(
        html,
        'text/html'
      );

      const nodes = $generateNodesFromDOM(
        editor,
        dom
      );

      const root = $getRoot();
      root.clear();
      root.append(...nodes);
    });
  }, [editor, html]);

  return null;
}