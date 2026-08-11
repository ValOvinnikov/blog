import {
  ALIGN,
  BRAND_VARIANT,
  CONTAINER_WIDTH,
  SPACING_SCALE,
} from '@blog/config';
import { tv } from 'tailwind-variants';

export const sectionVariants = tv({
  slots: {
    root: ['flex flex-col'],
    inner: ['mx-auto flex flex-col px-gutter'],
  },
  variants: {
    brandVariant: {
      [BRAND_VARIANT.PRIMARY]: { root: ['bg-primary'] },
      [BRAND_VARIANT.SECONDARY]: { root: ['bg-secondary'] },
      [BRAND_VARIANT.BRAND_PRIMARY]: { root: ['bg-brand-primary-muted'] },
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
      [CONTAINER_WIDTH.FULL]: { inner: ['max-w-page'] },
    },
    align: {
      [ALIGN.START]: { inner: ['items-start text-left'] },
      [ALIGN.CENTER]: { inner: ['items-center text-center'] },
    },
    divider: { true: { root: ['border-t border-border'] } },
  },
  defaultVariants: {
    spacingTop: SPACING_SCALE.NONE,
    spacingBottom: SPACING_SCALE.NONE,
    containerWidth: CONTAINER_WIDTH.WIDE,
    align: ALIGN.START,
    divider: false,
  },
});
