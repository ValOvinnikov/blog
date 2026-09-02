import { tv } from '@platform/utils/tv/tv';

export const fontPickerVariants = tv({
  slots: {
    root: ['flex flex-col gap-2'],
    option: [
      'flex cursor-pointer items-center gap-3 rounded-[10px] border-[1.5px] border-admin-line bg-admin-surface px-[13px] py-[11px]',
      'transition-colors',
      'has-[[data-checked]]:border-admin-brand has-[[data-checked]]:shadow-[0_0_0_3px_var(--admin-brand-weak)]',
      'has-[[data-disabled]]:cursor-not-allowed has-[[data-disabled]]:opacity-[.55]',
    ],
    radioRoot: [
      'flex size-4 shrink-0 items-center justify-center rounded-full border-[1.5px] border-admin-line',
      'data-[checked]:border-admin-brand',
      'outline-hidden focus-visible:ring-2 focus-visible:ring-admin-brand focus-visible:ring-offset-2',
    ],
    radioIndicator: ['size-2 rounded-full bg-admin-brand'],
    name: ['text-[17px] text-admin-text'],
  },
});
