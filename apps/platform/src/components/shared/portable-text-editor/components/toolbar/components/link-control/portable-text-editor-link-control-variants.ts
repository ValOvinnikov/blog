import { FIELD_FOCUS_CLASSES } from '@platform/utils/field-surface-classes/field-surface-classes';
import { tv } from '@platform/utils/tv/tv';

export const portableTextEditorLinkControlVariants = tv({
  slots: {
    root: ['flex', 'flex-wrap', 'items-center', 'gap-2'],
    input: [
      'min-h-11 w-full md:min-h-0 md:w-56 rounded-admin-control border px-2 py-1',
      'text-[16px] md:text-[13px] text-admin-text bg-admin-surface border-admin-control-line',
      FIELD_FOCUS_CLASSES,
    ],
    error: ['order-last basis-full text-[11.5px] text-admin-bad'],
  },
});
