import { tv } from '@platform/utils/tv/tv';

export const stepListVariants = tv({
  slots: {
    list: ['flex flex-1 flex-col'],
    step: ['flex flex-1 flex-wrap gap-3'],
    stepBody: ['flex min-w-0 flex-1 flex-col gap-1 pb-4'],
    stepTitle: ['text-[13.5px] font-semibold text-admin-text'],
    stepStatusLive: ['inline-flex items-center'],
    stepWhen: [
      'ml-auto flex-none whitespace-nowrap pt-0.5 text-[12px] text-admin-muted',
    ],
    visuallyHidden: ['sr-only'],
  },
});
