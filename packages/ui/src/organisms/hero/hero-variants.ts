import { tv } from '@blog/ui/lib/styling';

export const heroVariants = tv({
  slots: {
    root: ['py-[26px] pb-2'],
    content: ['flex flex-col'],
    grid: ['grid grid-cols-1 items-center gap-[clamp(1.25rem,4vw,2rem)]'],
    copy: ['min-w-0'],
    meta: ['mt-2 font-mono text-meta text-subtle'],
    title: ['mt-2.5 mb-3'],
    excerpt: ['m-0', 'max-w-[52ch]'],
    tags: ['flex flex-wrap gap-2', 'my-4'],
  },
  variants: {
    hasMedia: {
      true: {
        grid: ['lg:grid-cols-[minmax(0,1.15fr)_minmax(180px,0.85fr)]'],
      },
    },
  },
});
