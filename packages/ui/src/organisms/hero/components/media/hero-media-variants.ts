import { tv } from '@blog/ui/lib/styling';

/**
 * Layered on top of `MediaFrame`'s `ratio="video"` base (which already
 * supplies the rounded/border/surface chrome and the default 16:9 ratio).
 * Widens to MediaFrame's `classic` (4:3) ratio at the `lg` breakpoint, per
 * the home hero's design spec — the `lg:aspect-[4/3]` token has to stay
 * literal here (Tailwind's static scanner needs the full class name in
 * source) but its value must always match `mediaFrameVariants`'s `classic`
 * ratio, not a value invented locally. Visual ordering is applied by `Hero`
 * on the wrapping slot, not here.
 */
export const heroMediaVariants = tv({
  base: ['w-full', 'lg:aspect-[4/3]', 'min-h-[170px]'],
});
