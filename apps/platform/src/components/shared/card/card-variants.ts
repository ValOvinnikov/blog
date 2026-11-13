import { tv } from '@platform/utils/tv/tv';

export const cardVariants = tv({
  slots: {
    root: [
      'flex min-w-0 flex-col',
      'bg-platform-surface border border-platform-line',
      'rounded-platform shadow-platform',
    ],
    header: [
      'flex min-h-[50px] flex-wrap items-center gap-2.5',
      'rounded-t-platform border-b border-platform-line bg-platform-surface-head px-platform-card py-3',
    ],
    headerTitleGroup: ['min-w-0'],
    headerTitle: [],
    headerDescription: [
      'mt-0.5 block text-platform-12-5 leading-platform-18 text-platform-muted',
    ],
    headerActions: ['ml-auto flex items-center gap-2'],
    body: ['min-w-0 flex-1 px-platform-card py-4'],
    footer: [
      'flex items-center gap-2.5',
      'border-t border-platform-line-2 bg-platform-surface-2 px-platform-card py-[11px]',
      'rounded-b-platform',
    ],
    footerError: ['min-w-0 flex-1 basis-64'],
  },
  variants: {
    hasFooterError: {
      true: { footer: ['flex-wrap'] },
      false: {},
    },
    isDanger: {
      true: {
        root: ['border-platform-bad/30'],
        header: ['border-platform-bad/20'],
        headerTitle: ['text-platform-bad'],
      },
      false: {},
    },
  },
  defaultVariants: {
    hasFooterError: false,
    isDanger: false,
  },
});
