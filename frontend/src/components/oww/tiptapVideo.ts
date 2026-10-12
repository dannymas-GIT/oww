/** TipTap node so saved <video> tags round-trip in blog rich_text HTML. */
import { Node, mergeAttributes } from '@tiptap/core';

export const VideoEmbed = Node.create({
  name: 'videoEmbed',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      controls: { default: true },
      playsinline: { default: true },
    };
  },

  parseHTML() {
    return [{ tag: 'video[src]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'video',
      mergeAttributes(HTMLAttributes, {
        controls: 'true',
        playsinline: 'true',
        class: 'rounded-xl w-full max-w-full my-3',
      }),
    ];
  },
});
