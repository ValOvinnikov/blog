import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';

export const portableTextEditorToggleButtonVariants = tv({
  slots: {
    button: [
      'inline-flex items-center justify-center',
      'rounded-admin-control border border-transparent px-2 py-1',
      'min-h-11 min-w-11 md:min-h-0 md:min-w-0',
      'text-admin-12-5 text-admin-text',
      'hover:bg-admin-line-2',
      focusRingClasses(FOCUS_RING_GROUND.SURFACE),
      'cursor-pointer',
    ],
  },
  variants: {
    isActive: {
      true: { button: 'border-admin-brand bg-admin-brand-weak' },
    },
    isIconOnly: {
      true: { button: 'md:size-7 md:p-0' },
    },
  },
});
