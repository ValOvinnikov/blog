import { tv } from '@platform/utils/tv/tv';

// Matches the fades' w-7, so a revealed chip clears the fade on its side.
export const VOICE_SECTION_BAR_FADE_WIDTH_PX = 28;

export const voiceSectionBarVariants = tv({
  slots: {
    root: [
      'sticky top-admin-topbar z-3 flex items-center gap-3',
      'border border-admin-line bg-admin-surface py-2',
    ],
    jumpTo: [
      'shrink-0 text-admin-12 leading-4 font-semibold whitespace-nowrap text-admin-muted',
    ],
    nav: ['relative flex min-w-0 flex-1'],
    // The 4px inset keeps the chips' focus ring inside the scroll clip.
    list: [
      '-m-1 flex min-w-0 flex-1 list-none items-center gap-2 overflow-x-auto p-1',
      '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
    ],
    fade: [
      'pointer-events-none absolute inset-y-0 w-7 from-admin-surface to-admin-fade-end-surface',
    ],
    fadeStart: ['left-0 bg-linear-to-r'],
    fadeEnd: ['right-0 bg-linear-to-l'],
    actions: ['flex shrink-0 items-center gap-1.5'],
  },
  variants: {
    isPinned: {
      false: { root: ['rounded-admin pr-2.5 pl-3.5'] },
      true: {
        root: [
          '-mx-4 rounded-none border-x-0 border-t-transparent px-4 shadow-admin-bar',
          'md:-mx-admin-content md:px-admin-content',
        ],
      },
    },
  },
});
