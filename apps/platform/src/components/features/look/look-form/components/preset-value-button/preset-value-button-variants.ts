import { TEXT_LINK_STROKE_CLASSES } from '@platform/components/shared/text-link/text-link-variants';
import { tv } from '@platform/utils/tv/tv';

export const presetValueButtonVariants = tv({
  slots: {
    root: [
      'mt-1 flex w-fit text-admin-12-5 text-admin-brand-strong',
      TEXT_LINK_STROKE_CLASSES,
    ],
  },
});
