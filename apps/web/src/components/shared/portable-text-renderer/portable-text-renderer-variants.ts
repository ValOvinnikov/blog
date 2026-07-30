import { tv } from 'tailwind-variants';

export const portableTextRendererVariants = tv({
  slots: {
    root: ['[&>*+*]:mt-6'],
    // Matches `PostContentsRail`'s own `lg:top-24` sticky offset and
    // `useActiveHeadingId`'s `-96px` `rootMargin` — the shared buffer this
    // feature uses to keep an anchor-jumped-to heading clear of the sticky
    // `Header` (`top-0 z-10`) instead of landing flush behind it.
    headingAnchor: ['scroll-mt-24'],
  },
});
