import { tv } from '@platform/utils/tv/tv';

export const buttonColorFieldVariants = tv({
  slots: {
    root: ['flex w-full flex-col gap-3'],
    switchRow: ['flex flex-wrap items-center gap-x-3 gap-y-1'],
    colorRow: ['flex items-center gap-3'],
    picker: [
      'size-10 shrink-0 cursor-pointer rounded-platform-control border border-platform-line bg-transparent p-0.5',
      'disabled:cursor-not-allowed disabled:opacity-(--platform-locked-fade)',
    ],
    hexField: ['flex items-center gap-2'],
    hexLabel: ['text-platform-12-5 font-medium text-platform-muted'],
    hexInput: ['w-28 font-platform-mono'],
  },
});
