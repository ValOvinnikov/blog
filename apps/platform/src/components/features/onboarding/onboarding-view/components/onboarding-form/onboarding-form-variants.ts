import { tv } from '@platform/utils/tv/tv';

export const onboardingFormVariants = tv({
  slots: {
    root: [
      'min-h-dvh w-full bg-admin-bg text-admin-text',
      'lg:grid lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]',
    ],
    main: ['min-w-0'],
    form: [
      'grid grid-cols-1 items-start gap-6 p-4 md:p-[26px]',
      'lg:grid-cols-2 lg:grid-rows-[auto_1fr]',
    ],
    panel: ['lg:col-start-1 lg:row-start-1'],
    fields: ['flex flex-col gap-4 outline-hidden'],
    preview: [
      'lg:sticky lg:top-4 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start',
    ],
    actions: ['lg:col-start-1 lg:row-start-2'],
  },
});
