import { tv } from '@blog/ui/lib/styling';

export const headerBrandVariants = tv({
  base: [
    'inline-flex items-center',
    // forces any element child (the anchor, in practice) to become its own
    // centered flex container — an unstyled <a> would otherwise reintroduce
    // the baseline trap one level deeper
    '[&>*]:flex [&>*]:items-center',
    'font-display font-medium text-lg',
    'tracking-[-0.01em]',
    'text-text',
    'transition-colors hover:text-brand-primary',
  ],
});
