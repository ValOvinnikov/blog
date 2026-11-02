import { HEADER_BAR_STYLE, HEADER_LAYOUT } from '@blog/config';
import { tv } from '@platform/utils/tv/tv';

export const sampleSiteHeaderVariants = tv({
  slots: {
    root: ['relative'],
    full: ['items-center gap-3 @max-[64rem]:hidden'],
    bar: ['@[64rem]:hidden'],
    group: [],
    links: [],
    controls: [],
  },
  variants: {
    barStyle: {
      [HEADER_BAR_STYLE.FULL_WIDTH]: {
        root: ['border-b border-border @max-[64rem]:-mx-card-x'],
        full: ['pb-3'],
        bar: ['px-4 @[40rem]:px-8'],
      },
      [HEADER_BAR_STYLE.FLOATING]: {
        root: [
          'rounded-card border border-border bg-primary px-3 py-2.5 shadow-float',
        ],
      },
    },
    layout: {
      [HEADER_LAYOUT.CLASSIC]: {
        full: ['flex flex-wrap justify-between'],
        group: ['flex items-center gap-4'],
      },
      [HEADER_LAYOUT.LINKS_BESIDE_BRAND]: {
        full: ['grid grid-cols-[auto_1fr_auto] gap-x-6'],
        group: ['contents'],
      },
      [HEADER_LAYOUT.CENTRED_LINKS]: {
        full: ['grid grid-cols-[1fr_auto_1fr] gap-x-6'],
        group: ['contents'],
        controls: ['justify-self-end'],
      },
      [HEADER_LAYOUT.TWO_ROWS]: {
        full: ['grid grid-cols-[1fr_auto] gap-x-6'],
        group: ['contents'],
        links: ['col-span-full row-start-2 border-t border-border pt-3'],
        controls: ['justify-self-end'],
      },
      [HEADER_LAYOUT.CENTRED_BRAND]: {
        full: ['grid grid-cols-[1fr_auto_1fr] gap-x-6'],
        group: ['contents'],
        links: ['col-start-1 row-start-1'],
        controls: ['col-start-3 row-start-1 justify-self-end'],
      },
      [HEADER_LAYOUT.MENU_BUTTON]: {
        full: ['flex flex-wrap justify-between'],
        group: ['flex items-center gap-4'],
      },
    },
  },
});
