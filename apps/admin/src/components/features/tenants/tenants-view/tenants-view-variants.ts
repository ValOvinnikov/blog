import { tv } from 'tailwind-variants';

export const tenantsViewVariants = tv({
  slots: {
    root: ['flex flex-col'],
    toolbar: ['mb-3.5 flex justify-end'],
    codeChunk: [
      'rounded-[5px] bg-admin-line-2 px-[5px] py-px',
      'font-mono text-[0.92em]',
    ],
  },
});
