import { tv } from '@platform/utils/tv/tv';

export const onboardingFormVariants = tv({
  slots: {
    root: [
      'min-h-dvh w-full bg-admin-bg text-admin-text',
      'md:grid md:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]',
    ],
    main: ['min-w-0'],
    form: [
      'grid grid-cols-1',
      'xl:min-h-dvh xl:grid-cols-[minmax(0,1fr)_480px] xl:grid-rows-[1fr_auto] 2xl:grid-cols-[minmax(0,1fr)_560px]',
    ],
    panel: [
      'bg-admin-surface px-4 pt-6 pb-7 md:px-10 md:pt-10',
      'xl:col-start-1 xl:row-start-1 2xl:px-16 2xl:pt-14',
    ],
    fields: ['@container flex flex-col gap-4 outline-hidden'],
    preview: [
      'border-t border-admin-line px-3 pt-5 pb-6 md:p-[26px]',
      'xl:sticky xl:top-0 xl:col-start-2 xl:row-span-2 xl:row-start-1 xl:self-start xl:border-t-0 xl:px-7 xl:py-8',
    ],
    actions: [
      'sticky bottom-0 z-10 border-t border-admin-line bg-admin-surface p-4 md:px-10',
      'xl:col-start-1 xl:row-start-2 xl:border-admin-line-2 2xl:px-16',
    ],
  },
});
