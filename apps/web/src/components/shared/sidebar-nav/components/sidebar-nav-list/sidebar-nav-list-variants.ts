import { tv } from '@shinefold/ui/lib/styling';

export const sidebarNavListVariants = tv({
  slots: {
    list: [
      'flex flex-col gap-0.5',
      'border-l border-border',
      'font-mono text-copy',
      'm-0 list-none p-0',
    ],
    subList: ['mt-0.5 flex flex-col gap-0.5', 'm-0 list-none p-0'],
    // `-ml-px` lays the 2px bar over the list's 1px rail rather than beside it.
    link: [
      '-ml-px block rounded-r-md border-l-2 border-transparent',
      'py-1 pr-2 pl-3 text-subtle no-underline',
      'transition-colors duration-base ease-smooth',
      'hover:border-border-strong hover:text-text',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
      'focus-visible:ring-offset-2 focus-visible:ring-offset-ambient',
    ],
  },
  variants: {
    isInPanel: {
      true: { link: ['flex items-center py-2'] },
    },
    isNested: {
      true: { link: ['pl-6'] },
    },
    isSubItem: {
      true: { link: ['pl-9'] },
    },
    // Declared before `isActive` so the active colour wins over a root item's `text-text`.
    isRoot: {
      true: { link: ['font-semibold text-text'] },
    },
    // Last, so its hover classes win: hovering the current item leaves it unchanged.
    isActive: {
      true: {
        link: [
          'border-brand-primary text-brand-primary',
          'hover:border-brand-primary hover:text-brand-primary',
        ],
      },
    },
  },
  compoundVariants: [
    { isActive: true, isRoot: false, class: { link: ['font-medium'] } },
  ],
});
