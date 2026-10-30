import { tv } from '@platform/utils/tv/tv';

export const railIntroVariants = tv({
  slots: {
    root: ['flex flex-col gap-2'],
    title: ['text-admin-16 font-semibold text-white'],
    description: ['text-admin-13 text-admin-side-text'],
  },
  variants: {
    isPageHeading: {
      true: { title: ['text-admin-20 leading-tight'] },
    },
  },
});
