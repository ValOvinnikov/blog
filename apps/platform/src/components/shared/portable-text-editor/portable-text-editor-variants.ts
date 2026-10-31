import { CONTROL_MODE } from '@platform/constants/control-mode';
import { DISABLED_READONLY_SURFACE_CLASSES } from '@platform/utils/disabled-state-classes/disabled-state-classes';
import {
  FIELD_FOCUS_CLASSES,
  FIELD_SURFACE_CLASSES,
} from '@platform/utils/field-surface-classes/field-surface-classes';
import { INVALID_SURFACE_CLASSES } from '@platform/utils/invalid-state-classes/invalid-state-classes';
import { tv } from '@platform/utils/tv/tv';

export const portableTextEditorVariants = tv({
  slots: {
    root: ['flex', 'flex-col'],
    editable: [
      'min-h-[140px] w-full',
      FIELD_SURFACE_CLASSES,
      FIELD_FOCUS_CLASSES,
      '[&_p]:relative [&_h2]:relative [&_p]:m-0 [&_h2]:m-0 [&_h2]:text-admin-16 [&_h2]:font-semibold [&_h2]:font-admin [&_h2]:tracking-normal',
      '[&_ul]:m-0 [&_ul]:pl-5 [&_ol]:m-0 [&_ol]:pl-5',
      INVALID_SURFACE_CLASSES,
    ],
    placeholder: ['text-admin-muted'],
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
          'cursor-not-allowed text-admin-muted',
        ],
      },
    },
  },
  defaultVariants: {
    mode: CONTROL_MODE.EDITABLE,
  },
});
