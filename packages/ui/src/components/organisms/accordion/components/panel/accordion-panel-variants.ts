import { tv } from '@blog/ui/lib/styling';

export const accordionPanelVariants = tv({
  slots: {
    panel: [
      'h-(--accordion-panel-height) overflow-hidden',
      'transition-[height] duration-base ease-smooth motion-reduce:transition-none',
      'data-starting-style:h-0 data-ending-style:h-0',
    ],
    content: ['pb-4 text-copy text-text-muted'],
  },
});
