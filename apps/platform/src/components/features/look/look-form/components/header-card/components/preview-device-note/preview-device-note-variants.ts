import { TEXT_LINK_STROKE_CLASSES } from '@platform/components/shared/text-link/text-link-variants';
import { tv } from '@platform/utils/tv/tv';

export const previewDeviceNoteVariants = tv({
  slots: {
    root: [
      'flex flex-wrap items-center gap-2 text-platform-12-5 text-platform-text',
    ],
    action: [
      'gap-1.5 text-platform-12-5 text-platform-brand-strong',
      TEXT_LINK_STROKE_CLASSES,
    ],
  },
});
