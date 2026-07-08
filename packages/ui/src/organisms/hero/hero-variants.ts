import { tv } from 'tailwind-variants';

export const heroVariants = tv({
  slots: {
    root: [
      'grid grid-cols-1 items-center',
      'gap-[clamp(1.25rem,4vw,2rem)] py-[26px] pb-2',
    ],
    content: ['min-w-0'],
    meta: ['mt-2 font-mono text-meta text-subtle'],
    title: ['mt-2.5 mb-3 max-w-[16ch]'],
    excerpt: ['m-0 max-w-[52ch]'],
    tags: ['mt-4 flex flex-wrap gap-2'],
  },
  variants: {
    hasMedia: {
      true: {
        root: ['lg:grid-cols-[minmax(0,1.15fr)_minmax(180px,0.85fr)]'],
      },
    },
  },
});
