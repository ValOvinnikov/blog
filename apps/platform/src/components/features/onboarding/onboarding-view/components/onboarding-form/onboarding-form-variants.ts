import { tv } from '@platform/utils/tv/tv';

export const onboardingFormVariants = tv({
  slots: {
    root: [
      'min-h-dvh w-full bg-admin-bg text-admin-text',
      'md:grid md:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]',
    ],
    main: ['min-w-0'],
    form: [
      'grid grid-cols-1 items-start gap-6 p-4 md:p-[26px]',
      'xl:grid-cols-2 xl:grid-rows-[auto_1fr]',
    ],
    panel: ['xl:col-start-1 xl:row-start-1'],
    fields: ['@container flex flex-col gap-4 outline-hidden'],
    preview: [
      'xl:sticky xl:top-4 xl:col-start-2 xl:row-span-2 xl:row-start-1 xl:self-start',
    ],
    actions: ['xl:col-start-1 xl:row-start-2'],
  },
});
