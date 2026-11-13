import { FIELD_FOCUS_CLASSES } from '@platform/utils/field-surface-classes/field-surface-classes';
import { tv } from '@platform/utils/tv/tv';

export const portableTextEditorLinkControlVariants = tv({
  slots: {
    root: ['flex', 'flex-wrap', 'items-center', 'gap-2'],
    input: [
      'min-h-11 w-full md:min-h-0 md:w-56 rounded-platform-control border px-2 py-1',
      'text-platform-16 md:text-platform-13 text-platform-text bg-platform-surface border-platform-control-line-tint',
      FIELD_FOCUS_CLASSES,
    ],
    error: ['order-last basis-full text-platform-11-5 text-platform-bad'],
  },
});
