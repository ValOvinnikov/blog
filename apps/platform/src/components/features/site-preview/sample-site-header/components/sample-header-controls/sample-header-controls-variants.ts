import { tv } from '@platform/utils/tv/tv';
import { HEADER_CONTROL } from '@shinefold/ui/lib/styling';

export const sampleHeaderControlsVariants = tv({
  slots: {
    root: ['flex items-center gap-2'],
    themeToggle: [HEADER_CONTROL, 'size-9 px-0'],
  },
});
