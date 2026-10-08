import { tv } from '@platform/utils/tv/tv';

export const emailTemplatePreviewVariants = tv({
  slots: {
    root: [
      'overflow-hidden rounded-admin border border-admin-line bg-admin-surface-2',
    ],
    frame: ['mx-auto block h-[560px] w-full bg-white'],
  },
  variants: {
    width: {
      desktop: {},
      mobile: { frame: ['max-w-[375px]'] },
    },
  },
  defaultVariants: { width: 'desktop' },
});
