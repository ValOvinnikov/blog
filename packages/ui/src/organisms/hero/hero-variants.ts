import { tv } from '@blog/ui/lib/styling';

export const heroVariants = tv({
  slots: {
    root: ['w-full', 'bg-accent-muted border-b border-border-strong'],
    content: [
      'flex flex-col',
      'mx-auto w-full max-w-page px-gutter',
      'py-[26px] pb-8',
    ],
    grid: ['grid grid-cols-1 items-stretch gap-[clamp(1.25rem,4vw,2rem)]'],
    copy: ['flex h-full flex-col', 'min-w-0'],
    title: ['mt-2.5 mb-3'],
    excerpt: ['m-0', 'max-w-[52ch]'],
  },
  variants: {
    hasMedia: {
      true: {
        grid: ['lg:grid-cols-[minmax(0,1.15fr)_minmax(180px,0.85fr)]'],
      },
    },
  },
});
