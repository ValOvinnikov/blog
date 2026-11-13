import { BAR_CONTROL_CLASSES } from '@platform/utils/bar-control-classes/bar-control-classes';
import { tv } from '@platform/utils/tv/tv';

export const fullPathMenuVariants = tv({
  slots: {
    trigger: [
      ...BAR_CONTROL_CLASSES,
      'flex h-11 min-w-11 items-center justify-center px-1.5',
      'text-platform-14 font-semibold text-platform-text',
    ],
    popup: ['w-55'],
  },
});
