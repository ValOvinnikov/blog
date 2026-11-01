import { tv } from '@platform/utils/tv/tv';

export const TEXT_LINK_COLOUR_CLASSES = 'text-admin-brand';

export const textLinkVariants = tv({
  base: [
    'font-medium underline underline-offset-2',
    TEXT_LINK_COLOUR_CLASSES,
    'rounded-[2px] outline-hidden focus-visible:ring-2 focus-visible:ring-admin-brand',
  ],
});
