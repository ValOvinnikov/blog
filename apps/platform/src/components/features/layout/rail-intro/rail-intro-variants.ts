import { tv } from '@platform/utils/tv/tv';

export const railIntroVariants = tv({
  slots: {
    root: ['flex flex-col gap-2'],
    title: ['text-platform-16 font-semibold text-white'],
    description: ['text-platform-13 text-platform-rail-text'],
  },
  variants: {
    isPageHeading: {
      true: { title: ['text-platform-20 leading-tight'] },
    },
    isWizard: {
      true: {
        title: ['text-platform-20 leading-[1.3]'],
        description: ['leading-[1.55]'],
      },
    },
  },
});
