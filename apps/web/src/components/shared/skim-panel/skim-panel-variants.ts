import { tv } from 'tailwind-variants';

export const skimPanelVariants = tv({
  slots: {
    // Hidden unless the nearest `DepthProvider` wrapper is in SKIM — the
    // inverse of `blogPostPageVariants`' body/footer gate.
    root: ['hidden flex-col gap-6', 'group-data-[depth=SKIM]/depth:flex'],
    list: ['flex flex-col gap-3'],
    item: [
      'rounded-lg border border-border bg-primary-subtle px-4 py-3',
      'text-text',
    ],
  },
});
