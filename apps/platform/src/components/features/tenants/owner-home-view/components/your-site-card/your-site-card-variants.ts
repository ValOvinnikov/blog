import { tv } from '@platform/utils/tv/tv';

export const yourSiteCardVariants = tv({
  slots: {
    body: ['p-0'],
    band: [
      'm-0 grid grid-cols-2',
      'md:grid-cols-[minmax(0,3fr)_minmax(0,3fr)_minmax(0,2fr)_minmax(0,2fr)]',
    ],
    footer: ['items-start gap-2 px-4 md:px-admin-card'],
    icon: ['mt-px text-admin-muted'],
    hint: ['leading-admin-18'],
  },
});
