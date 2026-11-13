import { tv } from '@platform/utils/tv/tv';

export const stepListVariants = tv({
  slots: {
    list: ['flex flex-1 flex-col'],
    step: ['flex flex-1 flex-wrap gap-3'],
    stepBody: ['flex min-w-0 flex-1 flex-col gap-1 pb-4'],
    stepTitle: ['text-platform-13-5 font-semibold text-platform-text'],
    stepStatusLive: ['inline-flex items-center'],
    stepWhen: [
      'ml-auto flex-none whitespace-nowrap pt-0.5 text-platform-12 text-platform-muted',
    ],
    visuallyHidden: ['sr-only'],
  },
});
