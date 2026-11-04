import { tv } from '@platform/utils/tv/tv';

export const presetCardVariants = tv({
  slots: {
    body: [
      'grid gap-3 p-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:px-3.5',
    ],
    heading: ['flex min-w-0 flex-col gap-0.5 lg:col-start-1 lg:row-start-1'],
    strip: ['min-w-0 lg:col-span-2 lg:row-start-2'],
    reset: ['w-full lg:col-start-2 lg:row-start-1 lg:w-auto'],
  },
});
