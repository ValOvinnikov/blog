import { tv } from '@platform/utils/tv/tv';

export const tenantsSearchVariants = tv({
  slots: {
    root: ['min-w-0 flex-1 basis-56'],
    control: ['relative'],
    input: ['pr-11 [&::-webkit-search-cancel-button]:appearance-none'],
    clearButton: ['absolute top-1/2 right-1 -translate-y-1/2 px-[7px]'],
  },
});
