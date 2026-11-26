import { tv } from '@platform/utils/tv/tv';

export const pinnedTenantsVariants = tv({
  slots: {
    title: ['inline-flex items-center gap-2'],
    count: ['text-platform-12 font-normal text-platform-muted'],
    list: [
      'm-0 flex list-none gap-3 overflow-x-auto p-0',
      'snap-x snap-mandatory overscroll-x-contain',
      'md:grid md:snap-none md:grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] md:overflow-hidden',
    ],
  },
  variants: {
    isExpanded: {
      true: { list: [] },
      false: {
        list: ['md:grid-rows-[auto] md:auto-rows-[0px] md:gap-y-0'],
      },
    },
  },
});
