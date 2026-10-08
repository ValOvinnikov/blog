import { tv } from '@platform/utils/tv/tv';

export const draftRecoveryBannerVariants = tv({
  slots: {
    root: ['flex items-start gap-3', 'rounded-admin border px-4 py-3.5'],
    icon: ['mt-0.5 shrink-0'],
    body: ['flex min-w-0 flex-1 flex-col gap-2 text-[13.5px]'],
    title: ['font-semibold'],
    actions: ['flex flex-wrap gap-2'],
  },
  variants: {
    hasDifferences: {
      true: {
        root: ['border-admin-bad-line bg-admin-bad-weak'],
        icon: ['text-admin-bad'],
      },
      false: {
        root: ['border-admin-warn/30 bg-admin-warn-weak'],
        icon: ['text-admin-warn'],
      },
    },
  },
  defaultVariants: {
    hasDifferences: false,
  },
});
