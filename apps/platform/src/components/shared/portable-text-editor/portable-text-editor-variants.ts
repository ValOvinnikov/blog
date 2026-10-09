import { CONTROL_MODE } from '@blog/config';
import { DISABLED_READONLY_SURFACE_CLASSES } from '@platform/utils/disabled-state-classes/disabled-state-classes';
import { INVALID_SURFACE_CLASSES } from '@platform/utils/invalid-state-classes/invalid-state-classes';
import { tv } from '@platform/utils/tv/tv';

export const portableTextEditorVariants = tv({
  slots: {
    root: ['flex', 'flex-col'],
    editable: [
      'min-h-[140px] w-full rounded-admin-control border px-[11px] py-[9px]',
      'text-[16px] md:text-[13.5px] text-admin-text bg-admin-surface border-admin-control-line',
      'focus-visible:outline-2 focus-visible:outline-admin-brand-weak focus-visible:border-admin-brand',
      '[&_p]:relative [&_h2]:relative [&_p]:m-0 [&_h2]:m-0 [&_h2]:text-[16px] [&_h2]:font-semibold',
      '[&_ul]:m-0 [&_ul]:pl-5 [&_ol]:m-0 [&_ol]:pl-5',
      INVALID_SURFACE_CLASSES,
    ],
    link: ['text-admin-brand underline'],
    placeholder: ['text-admin-faint'],
  },
  variants: {
    mode: {
      [CONTROL_MODE.EDITABLE]: { editable: ['rounded-t-none border-t-0'] },
      [CONTROL_MODE.READ_ONLY]: {
        editable: [DISABLED_READONLY_SURFACE_CLASSES, 'text-admin-muted'],
      },
      [CONTROL_MODE.DISABLED]: {
        editable: [
          DISABLED_READONLY_SURFACE_CLASSES,
          'cursor-not-allowed text-admin-faint',
        ],
      },
    },
  },
  defaultVariants: {
    mode: CONTROL_MODE.EDITABLE,
  },
});
