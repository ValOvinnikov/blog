import { tv } from '@platform/utils/tv/tv';

export const cardVariants = tv({
  slots: {
    root: [
      'flex min-w-0 flex-col',
      'bg-admin-surface border border-admin-line',
      'rounded-admin shadow-admin',
    ],
    header: [
      'flex min-h-[50px] flex-wrap items-center gap-2.5',
      'rounded-t-admin border-b border-admin-line bg-admin-surface-head px-admin-card py-3',
    ],
    headerTitleGroup: ['min-w-0'],
    headerTitle: [],
    headerDescription: [
      'mt-0.5 block text-admin-12-5 leading-admin-18 text-admin-muted',
    ],
    headerActions: ['ml-auto flex items-center gap-2'],
    body: ['min-w-0 flex-1 px-admin-card py-4'],
    footer: [
      'flex items-center gap-2.5',
      'border-t border-admin-line-2 bg-admin-surface-2 px-admin-card py-[11px]',
      'rounded-b-admin',
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
        root: ['border-admin-bad/30'],
        header: ['border-admin-bad/20'],
        headerTitle: ['text-admin-bad'],
      },
      false: {},
    },
  },
  defaultVariants: {
    hasFooterError: false,
    isDanger: false,
  },
});
