/**
 * TipTap two/three-column layout for Document Studio.
 * Serializes as HTML `<div class="studio-columns" data-cols="2|3">` so markdown
 * round-trips with `html: true`.
 */
import { Node, mergeAttributes } from '@tiptap/core';
import { Node as ProseMirrorNode } from '@tiptap/pm/model';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    studioColumns: {
      insertColumns: (cols?: 2 | 3) => ReturnType;
    };
  }
}

export const StudioColumn = Node.create({
  name: 'studioColumn',
  content: 'block+',
  defining: true,
  isolating: true,

  parseHTML() {
    return [{ tag: 'div.studio-column' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { class: 'studio-column' }), 0];
  },
});

export const StudioColumns = Node.create({
  name: 'studioColumns',
  group: 'block',
  content: 'studioColumn{2,3}',
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      cols: {
        default: 2,
        parseHTML: el => {
          const n = parseInt(el.getAttribute('data-cols') || '2', 10);
          return n === 3 ? 3 : 2;
        },
        renderHTML: attrs => ({ 'data-cols': String(attrs.cols || 2) }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div.studio-columns' }];
  },

  renderHTML({ HTMLAttributes, node }) {
    const cols = (node.attrs.cols as number) || 2;
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        class: `studio-columns studio-columns-${cols}`,
        'data-cols': String(cols),
      }),
      0,
    ];
  },

  addCommands() {
    return {
      insertColumns:
        (cols: 2 | 3 = 2) =>
        ({ commands }) => {
          const column = {
            type: 'studioColumn',
            content: [{ type: 'paragraph' }],
          };
          const content = Array.from({ length: cols }, () => column);
          return commands.insertContent({
            type: this.name,
            attrs: { cols },
            content,
          });
        },
    };
  },

  addStorage() {
    return {
      markdown: {
        serialize(
          state: {
            write: (t: string) => void;
            renderContent: (node: ProseMirrorNode) => void;
            closeBlock: (node: unknown) => void;
          },
          node: ProseMirrorNode
        ) {
          const cols = (node.attrs.cols as number) || 2;
          state.write(`<div class="studio-columns studio-columns-${cols}" data-cols="${cols}">\n`);
          node.forEach((child: ProseMirrorNode) => {
            state.write('<div class="studio-column">\n');
            state.renderContent(child);
            state.write('</div>\n');
          });
          state.write('</div>\n');
          state.closeBlock(node);
        },
        parse: {},
      },
    };
  },
});
