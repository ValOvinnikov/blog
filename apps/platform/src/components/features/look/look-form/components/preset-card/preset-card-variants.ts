import { tv } from '@platform/utils/tv/tv';

export const presetCardVariants = tv({
  slots: {
    title: ['inline-flex items-center gap-2'],
    body: ['@container flex flex-col gap-4'],
  },
});
