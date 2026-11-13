import { MENU_GROUP_LABEL_TYPE } from '@platform/components/shared/menu-surface';
import { MENU_RADIO_GROUP_SIZE } from '@platform/constants/menu-radio-group';
import { tv } from '@platform/utils/tv/tv';

export const menuRadioGroupVariants = tv({
  slots: {
    root: [
      'mb-1 flex flex-col gap-2 border-b border-platform-popover-line px-2 pt-2 pb-2.5',
    ],
    label: [MENU_GROUP_LABEL_TYPE],
    track: [
      'flex gap-[3px] rounded-platform-control border border-platform-control-line bg-platform-theme-track p-[3px]',
    ],
    item: [
      'inline-flex min-w-0 flex-auto items-center justify-center gap-[5px] px-1 py-[5px]',
      'rounded-platform-control border-0 bg-transparent whitespace-nowrap outline-none',
      'cursor-pointer text-platform-12-5 font-medium text-platform-muted',
      'data-[checked]:bg-platform-segment-on data-[checked]:font-semibold data-[checked]:text-platform-text data-[checked]:shadow-platform',
      'data-[highlighted]:not-data-[checked]:bg-platform-popover-hover data-[highlighted]:not-data-[checked]:text-platform-text',
      'data-[highlighted]:shadow-[inset_0_0_0_2px_var(--platform-brand-ink)]',
      // Both states set box-shadow; this two-attribute selector keeps ring and raised shadow together on the checked item.
      'data-[checked]:data-[highlighted]:shadow-[inset_0_0_0_2px_var(--platform-brand-ink),var(--platform-shadow)]',
    ],
    hint: ['text-platform-12 leading-4 text-platform-muted'],
  },
  variants: {
    size: {
      [MENU_RADIO_GROUP_SIZE.DESKTOP]: { item: ['min-h-8'] },
      [MENU_RADIO_GROUP_SIZE.TOUCH]: { item: ['min-h-11'] },
    },
  },
  defaultVariants: {
    size: MENU_RADIO_GROUP_SIZE.DESKTOP,
  },
});
