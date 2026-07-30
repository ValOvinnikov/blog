import { tv } from 'tailwind-variants';

export const portableTextRendererVariants = tv({
  slots: {
    root: ['[&>*+*]:mt-6'],
    // `lg:scroll-mt-24` matches `PostContentsRail`'s `desktop` slot's own
    // `lg:top-24` sticky offset and `useActiveHeadingId`'s `-96px`
    // `rootMargin` at `lg:`+, where the rail is a side column and only the
    // sticky `Header` (`top-0 z-10`, ~63px measured) needs clearing.
    // Below `lg:`, the rail is instead an overhead, `position: sticky`
    // *strip* (`PostContentsRail`'s `root`, `top-16`) sitting directly under
    // the `Header` — an anchor jump has to clear both: the `Header` (64px,
    // matching `root`'s own `top-16`) *and* the collapsed strip pinned right
    // below it (measured live at 41px: `py-3` + the toggle's icon row +
    // `border-b`). 64 + 41 = 105px, which sits between the `24`/`28` steps
    // on the spacing scale (96px/112px) — `scroll-mt-28` (112px) is the one
    // that rounds up rather than down, so the heading always clears the
    // strip fully rather than landing a few pixels behind it.
    headingAnchor: ['scroll-mt-28', 'lg:scroll-mt-24'],
  },
});
