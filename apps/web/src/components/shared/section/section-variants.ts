import { BRAND_VARIANT, CONTAINER_WIDTH, SPACING_SCALE } from '@blog/config';
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
      [SPACING_SCALE.SM]: { root: ['pt-4 sm:pt-6'] },
      [SPACING_SCALE.MD]: { root: ['pt-8 sm:pt-10 lg:pt-12'] },
      [SPACING_SCALE.LG]: { root: ['pt-10 sm:pt-13 lg:pt-16'] },
      [SPACING_SCALE.XL]: { root: ['pt-14 sm:pt-18 lg:pt-24'] },
    },
    spacingBottom: {
      [SPACING_SCALE.NONE]: { root: ['pb-0'] },
      [SPACING_SCALE.SM]: { root: ['pb-4 sm:pb-6'] },
      [SPACING_SCALE.MD]: { root: ['pb-8 sm:pb-10 lg:pb-12'] },
      [SPACING_SCALE.LG]: { root: ['pb-10 sm:pb-13 lg:pb-16'] },
      [SPACING_SCALE.XL]: { root: ['pb-14 sm:pb-18 lg:pb-24'] },
    },
    containerWidth: {
      [CONTAINER_WIDTH.NARROW]: { inner: ['max-w-prose'] },
      [CONTAINER_WIDTH.WIDE]: { inner: ['max-w-5xl'] },
      [CONTAINER_WIDTH.FULL]: { inner: ['max-w-page'] },
    },
    dividerTop: { true: { root: ['border-t border-border'] } },
    dividerBottom: { true: { root: ['border-b border-border'] } },
  },
  defaultVariants: {
    spacingTop: SPACING_SCALE.NONE,
    spacingBottom: SPACING_SCALE.NONE,
    containerWidth: CONTAINER_WIDTH.WIDE,
    dividerTop: false,
    dividerBottom: false,
  },
});
