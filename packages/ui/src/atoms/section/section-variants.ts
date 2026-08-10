import {
  ALIGN,
  BACKGROUND_TONE,
  CONTAINER_WIDTH,
  SPACING_SCALE,
} from '@blog/config';
import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const sectionVariants = tv({
  slots: {
    root: ['flex flex-col'],
    inner: ['mx-auto flex flex-col'],
  },
  variants: {
    background: {
      [BACKGROUND_TONE.DEFAULT]: { root: ['bg-bg'] },
      [BACKGROUND_TONE.SUBTLE]: { root: ['bg-bg-subtle'] },
      [BACKGROUND_TONE.SURFACE]: { root: ['bg-surface'] },
      [BACKGROUND_TONE.ACCENT_TINT]: { root: ['bg-accent-muted'] },
      [BACKGROUND_TONE.INVERSE]: { root: ['bg-text text-bg'] },
    },
    spacingTop: {
      [SPACING_SCALE.NONE]: { root: ['pt-0'] },
      [SPACING_SCALE.SM]: { root: ['pt-6'] },
      [SPACING_SCALE.MD]: { root: ['pt-12'] },
      [SPACING_SCALE.LG]: { root: ['pt-16'] },
      [SPACING_SCALE.XL]: { root: ['pt-24'] },
    },
    spacingBottom: {
      [SPACING_SCALE.NONE]: { root: ['pb-0'] },
      [SPACING_SCALE.SM]: { root: ['pb-6'] },
      [SPACING_SCALE.MD]: { root: ['pb-12'] },
      [SPACING_SCALE.LG]: { root: ['pb-16'] },
      [SPACING_SCALE.XL]: { root: ['pb-24'] },
    },
    containerWidth: {
      [CONTAINER_WIDTH.NARROW]: { inner: ['max-w-prose'] },
      [CONTAINER_WIDTH.WIDE]: { inner: ['max-w-5xl'] },
      [CONTAINER_WIDTH.FULL]: { inner: ['max-w-none'] },
    },
    align: {
      [ALIGN.START]: { inner: ['items-start text-left'] },
      [ALIGN.CENTER]: { inner: ['items-center text-center'] },
    },
    divider: {
      true: { root: ['border-t border-border'] },
    },
  },
  defaultVariants: {
    background: BACKGROUND_TONE.DEFAULT,
    spacingTop: SPACING_SCALE.MD,
    spacingBottom: SPACING_SCALE.MD,
    containerWidth: CONTAINER_WIDTH.WIDE,
    align: ALIGN.START,
    divider: false,
  },
});

export type TSectionVariants = VariantProps<typeof sectionVariants>;
