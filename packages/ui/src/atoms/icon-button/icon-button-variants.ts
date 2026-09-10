import { BRAND_VARIANT } from '@blog/config';
import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const iconButtonVariants = tv({
  base: [
    'inline-grid size-[22px] place-items-center',
    'rounded-sm border border-transparent bg-transparent p-0',
    'text-muted transition-colors duration-base ease-smooth',
    'hover:border-border-emphasis hover:bg-surface-2 hover:text-text',
    'cursor-pointer',
    'focus-visible:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-primary',
    'disabled:pointer-events-none disabled:opacity-50',
  ],
  variants: {
    variant: {
      bordered: [
        'size-auto min-h-0 whitespace-nowrap',
        'rounded-sm border border-border-strong bg-surface px-3 py-1.5',
        'font-mono font-normal text-label text-text',
        'transition-colors duration-base ease-smooth',
        'hover:border-brand-primary hover:text-brand-primary',
      ],
      avatar: [
        'size-8 rounded-full border-0',
        'transition-shadow duration-base ease-smooth',
        'hover:ring-2 hover:ring-border-emphasis hover:ring-offset-2 hover:ring-offset-primary',
      ],
      control: [
        'size-9 rounded-full',
        'border border-brand-primary bg-transparent text-brand-primary',
        'hover:border-brand-primary hover:bg-brand-primary-muted hover:text-brand-primary',
        'focus-visible:bg-transparent',
      ],
    },
    tone: {
      [BRAND_VARIANT.PRIMARY]: [],
      [BRAND_VARIANT.SECONDARY]: [],
      [BRAND_VARIANT.BRAND_PRIMARY]: [],
    },
  },
  compoundVariants: [
    {
      variant: 'control',
      tone: BRAND_VARIANT.BRAND_PRIMARY,
      class: [
        'hover:border-brand-primary-solid hover:bg-brand-primary-solid hover:text-brand-primary-contrast',
        'focus-visible:bg-brand-primary-solid focus-visible:text-brand-primary-contrast',
      ],
    },
  ],
});

export type TIconButtonVariants = VariantProps<typeof iconButtonVariants>;
