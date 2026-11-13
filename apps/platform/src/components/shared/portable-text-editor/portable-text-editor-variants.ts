import { SIZE } from '@blog/config';
import { CONTROL_MODE } from '@platform/constants/control-mode';
import { DISABLED_READONLY_SURFACE_CLASSES } from '@platform/utils/disabled-state-classes/disabled-state-classes';
import {
  EDITABLE_SHELL_FOCUS_CLASSES,
  FIELD_FOCUS_CLASSES,
  FIELD_SURFACE_CLASSES,
} from '@platform/utils/field-surface-classes/field-surface-classes';
import { INVALID_SURFACE_CLASSES } from '@platform/utils/invalid-state-classes/invalid-state-classes';
import { tv } from '@platform/utils/tv/tv';
import type { VariantProps } from 'tailwind-variants';

export const portableTextEditorVariants = tv({
  slots: {
    root: ['flex', 'flex-col'],
    editable: [
      'w-full',
      '[&_p]:relative [&_h2]:relative [&_p]:m-0 [&_h2]:m-0 [&_h2]:text-platform-16 [&_h2]:font-semibold [&_h2]:font-platform [&_h2]:tracking-normal',
      '[&_ul]:m-0 [&_ul]:pl-5 [&_ol]:m-0 [&_ol]:pl-5',
    ],
    placeholder: ['text-platform-muted'],
    token: [
      'rounded-platform-3 bg-platform-line-2 px-1 py-px',
      'font-platform-mono text-platform-12-5 font-medium',
    ],
  },
  variants: {
    size: {
      [SIZE.SM]: {
        root: [
          'rounded-platform-control border border-platform-control-line bg-platform-surface',
          'has-[[contenteditable][data-invalid]]:border-platform-bad-line',
          EDITABLE_SHELL_FOCUS_CLASSES,
        ],
        editable: [
          'min-h-18 px-2.5 py-2 outline-hidden',
          'text-platform-16 leading-6 md:min-h-14 md:text-platform-13-5 md:leading-5 text-platform-text',
        ],
      },
      [SIZE.MD]: {
        editable: [
          'min-h-[140px]',
          FIELD_SURFACE_CLASSES,
          FIELD_FOCUS_CLASSES,
          INVALID_SURFACE_CLASSES,
        ],
      },
    },
    mode: {
      [CONTROL_MODE.EDITABLE]: {},
      [CONTROL_MODE.READ_ONLY]: {
        editable: [DISABLED_READONLY_SURFACE_CLASSES, 'text-platform-muted'],
      },
      [CONTROL_MODE.DISABLED]: {
        editable: [
          DISABLED_READONLY_SURFACE_CLASSES,
          'cursor-not-allowed text-platform-muted',
        ],
      },
    },
  },
  compoundVariants: [
    {
      size: SIZE.MD,
      mode: CONTROL_MODE.EDITABLE,
      class: { editable: ['rounded-t-none border-t-0'] },
    },
  ],
  defaultVariants: {
    size: SIZE.MD,
    mode: CONTROL_MODE.EDITABLE,
  },
});

type TPortableTextEditorVariants = VariantProps<
  typeof portableTextEditorVariants
>;

export type TPortableTextEditorSize = NonNullable<
  TPortableTextEditorVariants['size']
>;
