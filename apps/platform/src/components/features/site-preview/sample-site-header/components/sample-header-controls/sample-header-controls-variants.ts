import { HEADER_CONTROL } from '@blog/ui/lib/styling';
import { tv } from '@platform/utils/tv/tv';

export const sampleHeaderControlsVariants = tv({
  slots: {
    root: ['flex items-center gap-2'],
    themeToggle: [HEADER_CONTROL, 'size-9 px-0'],
    signIn: [
      HEADER_CONTROL,
      'inline-flex shrink-0 items-center justify-center gap-1.5',
      'min-h-9 pl-3 pr-4 py-0',
    ],
    signInGlyph: ['text-muted'],
  },
});
