import { tv } from '@platform/utils/tv/tv';

export const emailTemplatePreviewVariants = tv({
  slots: {
    root: [
      'overflow-x-auto rounded-admin border border-admin-line bg-admin-surface-2',
    ],
    frame: ['mx-auto block h-[560px] max-w-none bg-white'],
  },
  variants: {
    width: {
      desktop: { frame: ['w-[600px]'] },
      mobile: { frame: ['w-[375px]'] },
    },
  },
  defaultVariants: { width: 'desktop' },
});
