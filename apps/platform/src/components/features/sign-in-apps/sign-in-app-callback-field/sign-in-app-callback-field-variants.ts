import { TEXT_LINK_STROKE_CLASSES } from '@platform/components/shared/text-link/text-link-variants';
import { tv } from '@platform/utils/tv/tv';

export const signInAppCallbackFieldVariants = tv({
  slots: {
    hint: ['flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1'],
    consoleLink: [
      'text-platform-12 font-medium text-platform-brand-ink',
      TEXT_LINK_STROKE_CLASSES,
    ],
    row: ['flex flex-col gap-2 md:flex-row md:items-center'],
    value: [
      'flex min-h-9 min-w-0 flex-1 items-center rounded-platform-control px-3 py-2',
      'border border-platform-control-line-locked bg-platform-surface-2',
      'font-mono text-platform-12 break-all text-platform-text md:truncate md:break-normal',
    ],
  },
});
