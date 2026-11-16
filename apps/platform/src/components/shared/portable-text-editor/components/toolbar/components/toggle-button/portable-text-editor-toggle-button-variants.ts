import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { SELECTED_COMPACT_FILL_CLASSES } from '@platform/utils/selected-choice-classes/selected-choice-classes';
import { tv } from '@platform/utils/tv/tv';
import { SIZE } from '@shinefold/config';

export const portableTextEditorToggleButtonVariants = tv({
  slots: {
    button: [
      'inline-flex items-center justify-center',
      'rounded-platform-control border border-transparent',
      'text-platform-text',
      focusRingClasses(FOCUS_RING_GROUND.SURFACE),
      'cursor-pointer',
    ],
  },
  variants: {
    size: {
      [SIZE.SM]: {
        button: [
          'min-h-11 min-w-11 md:min-h-7 md:min-w-7 px-2',
          'text-platform-15 leading-4 md:text-platform-13',
        ],
      },
      [SIZE.MD]: {
        button: [
          'px-2 py-1 min-h-11 min-w-11 md:min-h-0 md:min-w-0',
          'text-platform-12-5',
        ],
      },
    },
    isActive: {
      true: {
        button: SELECTED_COMPACT_FILL_CLASSES,
      },
      false: { button: 'hover:bg-platform-hover-tint' },
    },
    isIconOnly: {
      true: {},
    },
  },
  compoundVariants: [
    {
      size: SIZE.SM,
      isIconOnly: true,
      class: { button: 'size-11 md:size-7 p-0' },
    },
    {
      size: SIZE.MD,
      isIconOnly: true,
      class: { button: 'md:size-7 md:p-0' },
    },
  ],
  defaultVariants: {
    size: SIZE.MD,
    isActive: false,
  },
});
