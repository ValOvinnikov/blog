import { tv } from '@platform/utils/tv/tv';

export const voiceFieldVariants = tv({
  slots: {
    root: ['flex flex-col gap-2'],
    header: ['flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5'],
    labelGroup: ['flex min-w-0 flex-col gap-0.5'],
    label: ['text-[13px] font-semibold text-admin-text'],
    hint: ['text-[11.5px] text-admin-muted'],
    note: ['text-[11.5px] text-admin-muted'],
    token: ['font-mono text-[11px] text-admin-text'],
    error: ['text-[11.5px] text-admin-bad'],
  },
});
