# valstack.dev — bespoke icon set

A drop-in replacement for the 6 `lucide-react` icons in shipped code, plus the
mobile-nav pair and 5 social brand marks. One "octagon" house style runs through
the core UI glyphs (faceted core, chamfered frames, octagon nodes).

## Files

- `icons.tsx` — all React components. Same call signature as lucide:
  `<SunIcon size={18} strokeWidth={1.6} aria-hidden="true" />`
- `svg/*.svg` — raw 24×24 SVGs (currentColor), for non-React use.
- `preview.html` — open in a browser; toggle dark mode + size + stroke to check every glyph.

## Two kinds of icon

**Stroke** (the 8 core + nav): `fill="none"`, `stroke="currentColor"`. Both
`size` and `strokeWidth` behave exactly like the lucide icons they replace.

**Fill** (the 5 social marks): solid glyphs. `size` works; `strokeWidth` is
accepted (so call sites don't change) but ignored. Exception: `RssIcon` is a
bare stroked glyph and uses a brand-weight stroke of `2.1` by default.

## What replaces what

| Old (lucide)   | New component                                                                     | File                                   | Call site                               |
| -------------- | --------------------------------------------------------------------------------- | -------------------------------------- | --------------------------------------- |
| `Sun`          | `SunIcon` (S3 octagon core)                                                       | `svg/sun.svg`                          | `theme-toggle.tsx`                      |
| `Moon`         | `MoonIcon` (MA clean crescent)                                                    | `svg/moon.svg`                         | `theme-toggle.tsx`                      |
| `Share2`       | `ShareIcon` (SH1 octagon nodes)                                                   | `svg/share.svg`                        | `post-share.tsx`                        |
| `Copy`         | `CopyIcon` (C2 octagon-cut sheets)                                                | `svg/copy.svg`                         | `post-share.tsx`                        |
| `Check`        | `CheckSheetIcon` (CK3) — recommended for the copy-menu swap; or `CheckIcon` (CK1) | `svg/check-sheet.svg`, `svg/check.svg` | `post-share.tsx`                        |
| `ExternalLink` | `ExternalLinkIcon` (EL-B chamfered frame)                                         | `svg/external-link.svg`                | `blog-post-page.tsx`, `author-page.tsx` |

### Mobile-nav toggle (new — not yet built)

| Purpose             | Component                                                      | File                                |
| ------------------- | -------------------------------------------------------------- | ----------------------------------- |
| Open (closed state) | `MenuIcon` (N1 hamburger) **or** `MenuRowsIcon` (N2 code-rows) | `svg/menu.svg`, `svg/menu-rows.svg` |
| Close (open state)  | `CloseIcon`                                                    | `svg/close.svg`                     |

Both menu options are included — only one goes in the slot; `CloseIcon` pairs
with either. Same 18px `IconButton` slot as `Sun`/`Moon`.

### Social marks (author page — bare true-logos)

| Platform | Component      | File               |
| -------- | -------------- | ------------------ |
| X        | `XIcon`        | `svg/x.svg`        |
| GitHub   | `GitHubIcon`   | `svg/github.svg`   |
| LinkedIn | `LinkedInIcon` | `svg/linkedin.svg` |
| Facebook | `FacebookIcon` | `svg/facebook.svg` |
| RSS      | `RssIcon`      | `svg/rss.svg`      |

Wire these into `author-page.tsx` by passing them to `ShareLink`'s optional
`icon` prop (mirroring how `blog-post-page.tsx` attaches `ExternalLink`). No API
change needed. YouTube / Instagram / Mastodon / Bluesky / Threads were marked
optional and aren't in this batch — easy to add in the same style later.

## Both checks / both menus

Per your calls, two Check variants (`CheckIcon` light, `CheckSheetIcon`
chamfered) and two Menu variants (`MenuIcon`, `MenuRowsIcon`) ship as
alternates. Pick one of each at integration.

## Notes

- All authored on a 24×24 grid, rendered at 16–18px in product.
- `currentColor` throughout, so `text-muted` at rest / `text-text` on hover keep
  working via `icon-button-variants.ts` — no per-icon color.
- Social marks are simplified redraws for UI use, not official logo files.
  Trademarks belong to their respective owners.
