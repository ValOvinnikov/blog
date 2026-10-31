import { FIELD_FOCUS_CLASSES } from '@platform/utils/field-surface-classes/field-surface-classes';
import { tv } from '@platform/utils/tv/tv';

export const portableTextEditorLinkControlVariants = tv({
  slots: {
    root: ['flex', 'flex-wrap', 'items-center', 'gap-2'],
    input: [
      'min-h-11 w-full md:min-h-0 md:w-56 rounded-admin-control border px-2 py-1',
      'text-admin-16 md:text-admin-13 text-admin-text bg-admin-surface border-admin-control-line-tint',
      FIELD_FOCUS_CLASSES,
    ],
    error: ['order-last basis-full text-admin-11-5 text-admin-bad'],
  },
});
