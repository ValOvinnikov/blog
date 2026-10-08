import { tv } from '@platform/utils/tv/tv';

export const emailSettingsVariants = tv({
  slots: {
    layout: [
      'grid grid-cols-1 items-start gap-6',
      'lg:grid-cols-[240px_minmax(0,1fr)]',
    ],
    main: ['flex', 'min-w-0', 'flex-col', 'gap-4'],
  },
});
