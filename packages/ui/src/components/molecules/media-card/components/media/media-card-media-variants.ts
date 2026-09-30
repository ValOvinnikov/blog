import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

/** `isLead`'s 4:3 ratio must always match `mediaFrameVariants`'s `classic` ratio, not a value invented locally. */
export const mediaCardMediaVariants = tv({
  base: ['relative overflow-hidden', 'bg-surface-2'],
  variants: {
    shape: {
      wide: ['w-full'],
      wideFlat: ['w-full'],
      square: ['w-full aspect-square'],
      circle: ['size-28 shrink-0 rounded-full mt-card-y'],
      icon: [
        'flex size-12 shrink-0 items-center justify-center rounded-md mt-card-y',
        'bg-brand-primary-muted text-brand-primary',
        'group-hover:bg-surface group-focus-within:bg-surface',
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
      true: [],
      false: [],
    },
  },
  compoundVariants: [
    { shape: 'wide', isLead: false, class: 'aspect-video' },
    { shape: 'wide', isLead: true, class: 'aspect-[4/3]' },
    { shape: 'wideFlat', class: 'aspect-[2/1]' },
    { shape: 'circle', align: 'left', class: 'mx-card-x' },
    { shape: 'circle', align: 'center', class: 'mx-auto' },
    { shape: 'icon', align: 'left', class: 'mx-card-x' },
    { shape: 'icon', align: 'center', class: 'mx-auto' },
    {
      iconPanel: true,
      class: [
        'flex items-center justify-center',
        'bg-brand-primary-muted text-brand-primary',
        'group-hover:bg-surface group-focus-within:bg-surface',
      ],
    },
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
