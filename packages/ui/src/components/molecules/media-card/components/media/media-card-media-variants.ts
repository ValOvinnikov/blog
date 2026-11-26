import { tv } from '@shinefold/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

const TINTED_FILL = [
  'bg-feature-icon-tile text-feature-icon-glyph',
  // A preset that sets the tile keeps it on hover, so the glyph stays on the fill it was measured against.
  'group-hover:bg-[var(--feature-icon-tile,transparent)] group-focus-within:bg-[var(--feature-icon-tile,transparent)]',
];

export const mediaCardMediaVariants = tv({
  base: ['relative overflow-hidden', 'bg-surface-2'],
  variants: {
    shape: {
      wide: ['w-full'],
      wideFlat: ['w-full'],
      square: [
        '@container w-full aspect-square',
        '[&>span]:text-[length:25cqi]',
      ],
      circle: [
        'size-20 md:size-24 lg:size-28 shrink-0 rounded-full mt-card-y',
        '[&>span]:text-2xl md:[&>span]:text-3xl lg:[&>span]:text-4xl',
      ],
      icon: [
        'flex size-12 shrink-0 items-center justify-center rounded-md mt-card-y',
        ...TINTED_FILL,
      ],
    },
    isLead: {
      true: [],
      false: [],
    },
    align: {
      left: [],
      center: [],
    },
    iconPanel: {
      true: ['flex items-center justify-center', ...TINTED_FILL],
      false: [],
    },
  },
  compoundVariants: [
    { shape: 'wide', isLead: false, class: 'aspect-card' },
    { shape: 'wide', isLead: true, class: 'aspect-split' },
    { shape: 'wideFlat', class: 'aspect-[2/1]' },
    { shape: 'circle', align: 'left', class: 'mx-card-x' },
    { shape: 'circle', align: 'center', class: 'mx-auto' },
    { shape: 'icon', align: 'left', class: 'mx-card-x' },
    { shape: 'icon', align: 'center', class: 'mx-auto' },
  ],
  defaultVariants: {
    shape: 'wide',
    isLead: false,
    align: 'left',
    iconPanel: false,
  },
});

export type TMediaCardMediaVariants = VariantProps<
  typeof mediaCardMediaVariants
>;
