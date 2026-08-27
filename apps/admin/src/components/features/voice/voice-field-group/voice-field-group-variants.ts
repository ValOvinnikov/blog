import { tv } from '@admin/utils/tv/tv';

export const voiceFieldGroupVariants = tv({
  slots: {
    body: ['flex flex-col gap-3.5'],
    vfield: ['flex flex-col gap-1'],
    vfieldLabel: ['flex items-baseline gap-2'],
    vfieldKey: ['font-mono text-[11px] text-admin-faint'],
  },
});
