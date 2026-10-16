import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

const ICON_TILE = [
  'flex size-12 shrink-0 items-center justify-center rounded-md',
  'bg-tint text-brand-primary',
  'group-hover:bg-surface group-focus-within:bg-surface',
];

/** `isLead`'s 4:3 ratio must always match `mediaFrameVariants`'s `classic` ratio, not a value invented locally. */
export const mediaCardMediaVariants = tv({
  slots: {
    base: ['relative overflow-hidden', 'bg-surface-2'],
    tile: ICON_TILE,
  },
  variants: {
    shape: {
      wide: { base: ['w-full'] },
      wideFlat: { base: ['w-full'] },
      square: { base: ['w-full aspect-square'] },
      circle: {
        base: [
          'size-20 md:size-24 lg:size-28 shrink-0 rounded-full mt-card-y',
          '[&>span]:text-2xl md:[&>span]:text-3xl lg:[&>span]:text-4xl',
        ],
      },
      icon: { base: [...ICON_TILE, 'mt-card-y'] },
    },
    isLead: {
      true: {},
      false: {},
    },
    align: {
      left: {},
      center: {},
    },
    iconPanel: {
      true: { base: ['bg-transparent overflow-visible'] },
      false: {},
    },
  },
  compoundVariants: [
    { shape: 'wide', isLead: false, class: { base: 'aspect-video' } },
    { shape: 'wide', isLead: true, class: { base: 'aspect-[4/3]' } },
    { shape: 'wideFlat', class: { base: 'aspect-[2/1]' } },
    { shape: 'circle', align: 'left', class: { base: 'mx-card-x' } },
    { shape: 'circle', align: 'center', class: { base: 'mx-auto' } },
    { shape: 'icon', align: 'left', class: { base: 'mx-card-x' } },
    { shape: 'icon', align: 'center', class: { base: 'mx-auto' } },
    {
      iconPanel: true,
      shape: ['wide', 'wideFlat', 'square'],
      class: { tile: 'mt-card-y' },
    },
    {
      iconPanel: true,
      shape: ['wide', 'wideFlat', 'square'],
      align: 'left',
      class: { tile: 'mx-card-x' },
    },
    { iconPanel: true, align: 'center', class: { tile: 'mx-auto' } },
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
