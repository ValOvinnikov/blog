import { tv } from '@platform/utils/tv/tv';

export const usageCardVariants = tv({
  slots: {
    body: ['p-0'],
    band: ['m-0 grid grid-cols-1 md:grid-cols-2'],
    footer: ['items-start gap-2 px-4 md:px-platform-card'],
    icon: ['mt-px text-platform-muted'],
    hint: ['leading-platform-18'],
  },
});
