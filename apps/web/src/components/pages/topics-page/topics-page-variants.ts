import { tv } from 'tailwind-variants';

export const topicsPageVariants = tv({
  slots: {
    root: ['bg-bg mx-auto w-full', 'max-w-page px-gutter py-page-y'],
    heading: 'mb-4',
    intro: 'mb-10',
    empty: 'mt-10',
    list: ['grid grid-cols-1 gap-4', 'md:grid-cols-2 lg:grid-cols-3'],
    card: [
      'relative flex flex-col gap-2 rounded-md',
      'bg-surface border border-border',
      'px-card-x py-card-y',
      'transition-[transform,border-color] duration-base ease-console',
      'hover:-translate-y-0.5 hover:border-border-strong',
      'focus-within:-translate-y-0.5 focus-within:border-border-strong',
      'motion-reduce:transition-none motion-reduce:transform-none',
    ],
    cardLink: ['before:absolute before:inset-0'],
  },
});
