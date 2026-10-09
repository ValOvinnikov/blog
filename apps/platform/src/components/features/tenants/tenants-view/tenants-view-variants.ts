import { tv } from '@platform/utils/tv/tv';

export const tenantsViewVariants = tv({
  slots: {
    root: ['flex flex-col gap-6'],
    toolbar: ['flex justify-end'],
    codeChunk: [
      'rounded-admin-control bg-admin-line-2 px-[5px] py-px',
      'font-mono text-[0.92em]',
    ],
  },
});
