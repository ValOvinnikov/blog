import { tv, type VariantProps } from 'tailwind-variants';

export const provisioningBannerVariants = tv({
  slots: {
    root: [
      'flex flex-wrap items-center gap-3.5',
      'rounded-admin border px-4 py-3.5 shadow-admin',
    ],
    icon: ['flex-none text-base leading-none'],
    textGroup: ['min-w-[200px] flex-1'],
    title: ['block text-[13.5px] font-semibold'],
    description: ['block text-[12.5px] text-admin-muted'],
  },
  variants: {
    tone: {
      ok: {
        root: ['bg-admin-ok-weak border-admin-ok/30'],
        icon: ['text-admin-ok'],
      },
      warn: {
        root: ['bg-admin-warn-weak border-admin-warn/30'],
        icon: ['text-admin-warn'],
      },
      bad: {
        root: ['bg-admin-bad-weak border-admin-bad/30'],
        icon: ['text-admin-bad'],
      },
    },
  },
});

export type TProvisioningBannerVariants = VariantProps<
  typeof provisioningBannerVariants
>;
