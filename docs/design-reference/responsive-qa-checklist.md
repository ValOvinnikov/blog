# Responsive QA checklist

Use the Home page sections of this checklist for the current rollout. Post
Detail checks are deferred until the Post Detail slice starts.

## Global

- [ ] Test 375px width.
- [ ] Test 768px width.
- [ ] Test 1024px width.
- [ ] Test 1280px width.
- [ ] Light mode renders with correct semantic colours.
- [ ] Dark mode renders with correct semantic colours.
- [ ] No horizontal document scroll appears.
- [ ] Header nav wraps instead of overflowing.
- [ ] Focus rings are visible on links and buttons.
- [ ] Reduced-motion mode disables hover movement.

## Home page

- [ ] Home hero without image is a single-column text layout at all widths.
- [ ] Home hero with image is single-column below `lg`.
- [ ] Home hero with image becomes two columns at `lg`.
- [ ] Home hero image keeps `4 / 3` ratio and uses `object-cover`.
- [ ] Hero title keeps narrow measure with `max-w-[16ch]`.
- [ ] Latest posts grid is 1 column on mobile.
- [ ] Latest posts grid is 2 columns at `sm`.
- [ ] Latest posts grid is 3 columns at `lg`.
- [ ] Post cards lift by `2px` on hover/focus and have no shadow.
- [ ] Footer stacks on mobile and becomes a row at `sm`.

## Post Detail page (deferred)

- [ ] Post page container uses `max-w-post`, not `max-w-page`.
- [ ] Article content stays within `max-w-measure`.
- [ ] Post title keeps narrow measure with `max-w-[18ch]`.
- [ ] Post metadata wraps on small screens.
- [ ] Post without cover image has no blank figure or reserved media gap.
- [ ] Post with cover image keeps `16 / 9` ratio.
- [ ] Cover caption wraps naturally and does not overflow.
- [ ] Code blocks use `overflow-x-auto` and do not overflow the viewport.
- [ ] Tags wrap and do not create horizontal scrolling.
