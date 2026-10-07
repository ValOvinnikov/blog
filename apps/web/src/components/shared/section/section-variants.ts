import { BRAND_VARIANT, CONTAINER_WIDTH, SPACING_SCALE } from '@blog/config';
import {
  BAND_SPACING_BOTTOM,
  BAND_SPACING_TOP,
  tv,
} from '@blog/ui/lib/styling';

export const sectionVariants = tv({
  slots: {
    root: ['flex flex-col'],
    inner: ['mx-auto w-full flex flex-col px-gutter'],
  },
  variants: {
    brandVariant: {
      [BRAND_VARIANT.PRIMARY]: { root: ['bg-primary'] },
      [BRAND_VARIANT.SECONDARY]: { root: ['bg-secondary surface-secondary'] },
      [BRAND_VARIANT.BRAND_PRIMARY]: {
        root: ['bg-brand-primary-muted surface-brand-primary'],
      },
    },
    spacingTop: {
      [SPACING_SCALE.NONE]: { root: [BAND_SPACING_TOP[SPACING_SCALE.NONE]] },
      [SPACING_SCALE.SM]: { root: [BAND_SPACING_TOP[SPACING_SCALE.SM]] },
      [SPACING_SCALE.MD]: { root: [BAND_SPACING_TOP[SPACING_SCALE.MD]] },
      [SPACING_SCALE.LG]: { root: [BAND_SPACING_TOP[SPACING_SCALE.LG]] },
      [SPACING_SCALE.XL]: { root: [BAND_SPACING_TOP[SPACING_SCALE.XL]] },
    },
    spacingBottom: {
      [SPACING_SCALE.NONE]: { root: [BAND_SPACING_BOTTOM[SPACING_SCALE.NONE]] },
      [SPACING_SCALE.SM]: { root: [BAND_SPACING_BOTTOM[SPACING_SCALE.SM]] },
      [SPACING_SCALE.MD]: { root: [BAND_SPACING_BOTTOM[SPACING_SCALE.MD]] },
      [SPACING_SCALE.LG]: { root: [BAND_SPACING_BOTTOM[SPACING_SCALE.LG]] },
      [SPACING_SCALE.XL]: { root: [BAND_SPACING_BOTTOM[SPACING_SCALE.XL]] },
    },
    containerWidth: {
      [CONTAINER_WIDTH.NARROW]: { inner: ['max-w-measure'] },
      [CONTAINER_WIDTH.WIDE]: { inner: ['max-w-wide'] },
      [CONTAINER_WIDTH.FULL]: { inner: ['max-w-page'] },
    },
    dividerTop: { true: { root: ['border-t border-divider'] } },
    dividerBottom: { true: { root: ['border-b border-divider'] } },
  },
  defaultVariants: {
    spacingTop: SPACING_SCALE.MD,
    spacingBottom: SPACING_SCALE.MD,
    containerWidth: CONTAINER_WIDTH.WIDE,
    dividerTop: false,
    dividerBottom: false,
  },
});
