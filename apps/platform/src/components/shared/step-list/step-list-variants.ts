import { tv } from '@platform/utils/tv/tv';

export const stepListVariants = tv({
  slots: {
    list: ['flex flex-1 flex-col'],
    step: ['flex flex-1 flex-wrap gap-3'],
    indicatorCol: ['flex flex-none flex-col items-center self-stretch'],
    circle: [
      'flex h-6 w-6 flex-none items-center justify-center',
      'rounded-full text-xs font-bold',
    ],
    connector: ['my-1 w-0.5 flex-1 bg-admin-line-2'],
    stepBody: ['flex min-w-0 flex-1 flex-col gap-1 pb-4'],
    stepTitle: ['text-[13.5px] font-semibold text-admin-text'],
    stepStatusLive: ['inline-flex items-center'],
    stepWhen: [
      'ml-auto flex-none whitespace-nowrap pt-0.5 text-[11.5px] text-admin-faint',
    ],
    visuallyHidden: ['sr-only'],
  },
  variants: {
    status: {
      IDLE: { circle: ['bg-admin-line-2 text-admin-muted'] },
      RUNNING: { circle: ['bg-admin-warn text-white'] },
      DONE: { circle: ['bg-admin-ok text-white'] },
      FAILED: { circle: ['bg-admin-bad text-white'] },
    },
    isDone: {
      true: { connector: ['bg-admin-ok'] },
      false: {},
    },
  },
  defaultVariants: {
    isDone: false,
  },
});
