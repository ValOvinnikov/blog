import { tv } from '@platform/utils/tv/tv';

export const accordionVariants = tv({
  slots: {
    root: ['flex flex-col'],
    item: ['border-b border-admin-line-2'],
    header: ['m-0'],
    trigger: [
      'group/accordion-trigger flex min-h-11 w-full cursor-pointer items-center gap-3 py-3 text-left',
      'outline-hidden focus-visible:ring-2 focus-visible:ring-admin-brand focus-visible:ring-offset-2',
    ],
    chevron: [
      'shrink-0 text-admin-muted',
      'transition-transform duration-base ease-smooth motion-reduce:transition-none',
      'group-data-[panel-open]/accordion-trigger:rotate-180',
    ],
    panel: [
      'h-(--accordion-panel-height) overflow-hidden',
      'transition-[height] duration-slow ease-smooth motion-reduce:transition-none',
      'data-[starting-style]:h-0 data-[ending-style]:h-0',
    ],
    panelContent: ['pb-3.5'],
  },
});
