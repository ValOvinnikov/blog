import { HEADER_CONTROL } from '@blog/ui/lib/styling';
import { tv } from '@platform/utils/tv/tv';

export const sampleHeaderControlsVariants = tv({
  slots: {
    root: ['flex items-center gap-2'],
    themeToggle: [HEADER_CONTROL, 'size-9 px-0'],
  },
});
