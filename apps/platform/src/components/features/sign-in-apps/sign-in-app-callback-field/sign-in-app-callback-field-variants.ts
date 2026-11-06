import { tv } from '@platform/utils/tv/tv';

export const signInAppCallbackFieldVariants = tv({
  slots: {
    hint: ['flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1'],
    consoleLink: [
      'text-admin-12 font-medium text-admin-brand-ink underline-offset-2 hover:underline',
    ],
    row: ['flex flex-col gap-2 md:flex-row md:items-center'],
    value: [
      'flex min-h-9 min-w-0 flex-1 items-center rounded-admin-control px-3 py-2',
      'border border-admin-control-line-locked bg-admin-surface-2',
      'font-mono text-admin-12 break-all text-admin-text md:truncate md:break-normal',
    ],
  },
});
