import { tv } from '@blog/ui/lib/styling';

export const footerGroupsVariants = tv({
  base: [
    'grid min-w-0 grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-3 lg:grid-cols-4',
    'group-data-[layout=CENTRED]/footer:flex group-data-[layout=CENTRED]/footer:flex-wrap',
    'group-data-[layout=CENTRED]/footer:justify-center group-data-[layout=CENTRED]/footer:gap-x-5 group-data-[layout=CENTRED]/footer:gap-y-2',
  ],
});
