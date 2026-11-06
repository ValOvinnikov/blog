import { tv } from '@platform/utils/tv/tv';

// The widest fade (the phone's right one, w-9), so a revealed chip clears the fade on either side.
export const VOICE_SECTION_BAR_REVEAL_INSET_PX = 36;

export const voiceSectionBarVariants = tv({
  slots: {
    root: [
      'sticky top-admin-topbar z-3 flex items-center gap-2 lg:gap-3',
      'border border-admin-line bg-admin-surface md:py-2',
    ],
    jumpTo: [
      'hidden shrink-0 text-admin-12 leading-4 font-semibold whitespace-nowrap text-admin-muted lg:block',
    ],
    nav: ['relative flex min-w-0 flex-1'],
    // The 4px block inset keeps the chips' focus ring inside the scroll clip.
    list: [
      '-my-1 -me-1 flex min-w-0 flex-1 list-none items-center gap-2 overflow-x-auto py-1 pe-1 md:-m-1 md:p-1',
      'scroll-px-9 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
    ],
    fade: [
      'pointer-events-none absolute inset-y-0 from-admin-surface to-admin-fade-end-surface',
    ],
    fadeStart: ['left-0 w-7 bg-linear-to-r'],
    fadeEnd: ['right-0 w-9 bg-linear-to-l md:w-7'],
  },
  variants: {
    isPinned: {
      false: {
        root: ['rounded-admin py-[7.5px] pr-[7px] pl-0', 'md:pr-2.5 md:pl-3.5'],
        list: ['ps-2'],
      },
      true: {
        root: [
          '-mx-4 rounded-none border-x-0 border-t-0 py-2 pr-4 pl-0 shadow-admin-bar',
          'md:-mx-admin-content md:border-t md:border-t-transparent md:px-admin-content',
        ],
        list: ['ps-4'],
      },
    },
  },
});
