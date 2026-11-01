import { SIZE } from '@blog/config';
import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';

export const portableTextEditorToggleButtonVariants = tv({
  slots: {
    button: [
      'inline-flex items-center justify-center',
      'rounded-admin-control border border-transparent',
      'text-admin-text',
      'hover:bg-admin-line-2',
      focusRingClasses(FOCUS_RING_GROUND.SURFACE),
      'cursor-pointer',
    ],
  },
  variants: {
    size: {
      [SIZE.SM]: {
        button: [
          'min-h-11 min-w-11 md:min-h-7 md:min-w-7 px-2',
          'text-admin-15 leading-4 md:text-admin-13',
        ],
      },
      [SIZE.MD]: {
        button: [
          'px-2 py-1 min-h-11 min-w-11 md:min-h-0 md:min-w-0',
          'text-admin-12-5',
        ],
      },
    },
    isActive: {
      true: { button: 'border-admin-brand bg-admin-brand-weak' },
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
  },
});
