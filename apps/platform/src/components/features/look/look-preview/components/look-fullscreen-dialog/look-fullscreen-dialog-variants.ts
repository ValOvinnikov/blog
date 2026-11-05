import { tv } from '@platform/utils/tv/tv';

export const lookFullscreenDialogVariants = tv({
  slots: {
    popup: ['fixed inset-0 z-40 flex flex-col bg-admin-surface'],
    head: [
      'grid flex-none grid-cols-[minmax(0,1fr)_auto] grid-rows-[minmax(44px,auto)] gap-x-3 gap-y-2 px-4 pt-2 pb-2.5',
      'lg:flex lg:h-15 lg:items-center lg:gap-4 lg:py-0 lg:pr-4 lg:pl-6',
      'border-b border-admin-line bg-admin-surface',
    ],
    title: [
      'col-start-1 row-start-1 m-0 self-center font-admin whitespace-nowrap text-admin-text',
      'text-admin-16 leading-[22px] font-semibold',
      'lg:text-admin-15 lg:leading-5 lg:font-admin-650',
    ],
    readoutPlacement: ['col-span-2 row-start-3 leading-[18px]'],
    toolbar: [
      'col-span-2 row-start-2 min-w-0 lg:ml-auto lg:flex-none',
      '*:flex-nowrap',
    ],
    rule: ['hidden h-6 w-px flex-none bg-admin-line lg:block'],
    close: ['col-start-2 row-start-1 flex flex-none items-center'],
    stage: [
      'flex min-h-0 flex-1 flex-col bg-admin-theme-track p-2.5 lg:p-6',
      'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-admin-brand-ink',
    ],
  },
});
