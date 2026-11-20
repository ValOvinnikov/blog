import { tv } from '@platform/utils/tv/tv';

export const teamPersonVariants = tv({
  slots: {
    root: ['flex min-w-0 items-center gap-3'],
    lines: ['flex min-w-0 flex-col'],
    address: ['text-platform-13-5 font-medium break-words text-platform-text'],
    detail: ['text-platform-12 text-platform-muted max-md:hidden'],
    stackedDetail: ['text-platform-12 text-platform-muted md:hidden'],
  },
  variants: {
    hasEmail: {
      false: { address: ['font-normal text-platform-muted'] },
    },
  },
});
