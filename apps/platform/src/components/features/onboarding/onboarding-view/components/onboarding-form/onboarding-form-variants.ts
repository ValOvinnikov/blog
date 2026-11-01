import { tv } from '@platform/utils/tv/tv';

export const onboardingFormVariants = tv({
  slots: {
    root: [
      'flex min-h-dvh w-full flex-col bg-admin-bg text-admin-text',
      'md:grid md:h-dvh md:grid-cols-[300px_minmax(0,1fr)] md:overflow-hidden',
    ],
    form: [
      'flex flex-1 flex-col',
      'md:grid md:min-h-0 md:grid-cols-1 md:grid-rows-[minmax(0,1fr)_auto] md:bg-admin-surface',
      'min-[85rem]:grid-cols-[minmax(0,1fr)_560px]',
    ],
    main: [
      'min-w-0 bg-admin-surface px-4 pt-6 pb-7',
      'md:col-start-1 md:row-start-1 md:flex md:min-h-0 md:flex-col md:p-0',
    ],
    scrollArea: [
      'md:min-h-0 md:flex-1 md:overflow-y-auto md:px-16 md:pt-14 md:pb-14',
    ],
    column: ['md:max-w-[640px]'],
    panel: ['flex flex-col outline-hidden'],
    fields: ['@container mt-5 flex flex-col gap-6 md:mt-8 md:gap-7'],
    railPreview: ['mt-8'],
    previewColumn: [
      'col-start-2 row-span-2 row-start-1 flex min-h-0 flex-col overflow-hidden bg-admin-bg px-7 py-8',
    ],
    phonePreview: [
      'flex-1 border-t border-admin-line bg-admin-bg px-3 pt-5 pb-6 md:hidden',
    ],
    actions: [
      'border-t border-admin-line bg-admin-surface p-4',
      'md:col-start-1 md:row-start-2 md:mx-16 md:max-w-[640px] md:border-admin-line-2 md:px-0 md:pt-5 md:pb-10',
    ],
  },
});
