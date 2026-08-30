# Admin panel mock — correction brief

> **Feed this to the agent revising `admin-panel-mock.html`.** The mock's
> layout, information architecture, and interaction model are good and should
> be preserved. What follows are factual mismatches against this repo's real
> design tokens and content model. Every value below was read out of the
> source files cited — use those exact values, don't re-derive them.
>
> Governing docs: `docs/superpowers/specs/2026-08-13-admin-panel-product-design.md`
> (product surface) and `…-tenant-config-postgres-admin-design.md`
> (infrastructure + sequencing).

## 1. Accent color derivation is wrong — highest priority

The mock derives accent from HSL (`admin-panel-mock.html:787`,
`hsl(<h> 72% <l>%)`, and the hue-slider gradient at `:157`). Production uses
**OKLCH**, with **different lightness/chroma in light vs. dark mode**. The live
preview is therefore showing colors the real site will never render — which
defeats the entire purpose of a live preview.

Replace with the exact ramp from `apps/web/src/utils/build-theme-style-block.ts`:

| Token                         | Light                  | Dark                    |
| ----------------------------- | ---------------------- | ----------------------- |
| `--brand-primary`             | `oklch(0.53 0.17 <h>)` | `oklch(0.7 0.16 <h>)`   |
| `--brand-primary-hover`       | `oklch(0.47 0.17 <h>)` | `oklch(0.76 0.16 <h>)`  |
| `--brand-primary-muted`       | `oklch(0.95 0.03 <h>)` | `oklch(0.3 0.06 <h>)`   |
| `--brand-primary-contrast`    | `oklch(0.99 0 0)`      | `oklch(0.16 0.006 250)` |
| `--brand-primary-solid`       | `oklch(0.55 0.17 <h>)` | `oklch(0.7 0.16 <h>)`   |
| `--brand-primary-solid-hover` | `oklch(0.49 0.17 <h>)` | `oklch(0.76 0.16 <h>)`  |

Only the **hue** channel varies with the slider; lightness and chroma are fixed
(this is what keeps WCAG contrast verified — see the rollout plan's global
constraints). The hue-slider gradient track must be built from
`oklch(0.53 0.17 <h>)` samples, not HSL, or the track won't match the swatch it
selects.

Note `--brand-primary-contrast` is a **constant**, not hue-derived.

## 2. Logo hue is missing entirely

`TThemeTokens` (`packages/config/src/constants/preset.ts`) has an optional
`logoHue?: number`, separate from `accentHue`. It drives `--logo-1/2/3` only,
and **defaults to `accentHue` when unset**. Add a second, optional hue control
under the accent one — with a visible "follows accent" default state, since the
optionality is the interesting part of its UX.

Its ramp (same file as above):

| Token      | Light                  | Dark                   |
| ---------- | ---------------------- | ---------------------- |
| `--logo-1` | `oklch(0.52 0.17 <h>)` | `oklch(0.58 0.17 <h>)` |
| `--logo-2` | `oklch(0.63 0.16 <h>)` | `oklch(0.68 0.16 <h>)` |
| `--logo-3` | `oklch(0.73 0.13 <h>)` | `oklch(0.8 0.14 <h>)`  |

## 3. Radius scale — wrong labels

Mock has Sharp / Soft / Round / Pill (`:471–474`). The real set is
`RADIUS_SCALE` = `SM`/`MD`/`LG`/`XL`, and `RADIUS_SCALE_LABEL` already defines
the display strings:

**Small · Medium · Large · Extra Large**

Use those labels verbatim — they're a shipped export, not a naming
opportunity.

## 4. Density — three options, should be two

Mock has Compact / Cozy / Comfortable (`:481–483`). `DENSITY` has exactly
**two** members: `DEFAULT` and `COMPACT`. Render as **Default · Compact**.
Drop the third control entirely; don't map three UI options onto two values.

## 5. Font pickers offer fonts that don't exist

Mock adds **Source Serif 4** and **IBM Plex Mono** (`:773`). `FONT_CHOICE` is a
**closed set of five**:

- Space Grotesk
- Newsreader
- JetBrains Mono
- Fraunces
- Inter

This set is closed for a build-time reason, not an aesthetic one: `next/font`
loaders must be static and module-scoped, so every selectable font is
statically imported and `preload`-toggled per tenant. A font that isn't in this
list cannot be selected without a code change and a deploy. Remove the two
extras from both the heading and body pickers.

Keep the mock's nice touch of rendering each option's name in its own face —
that part is right.

## 6. Preset defaults must match the registry

Both presets' default token values come from `PRESET_REGISTRY`. Any preview of
"what picking this preset does" must use these:

|               | CONSOLE       | EDITORIAL |
| ------------- | ------------- | --------- |
| `accentHue`   | 250           | 28        |
| `headingFont` | Space Grotesk | Fraunces  |
| `bodyFont`    | Newsreader    | Inter     |
| `radiusScale` | Medium        | Small     |
| `density`     | Default       | Compact   |
| `chromeOn`    | true          | false     |

The mock's preset _descriptions_ ("Mono, terminal chrome" / "Serif,
de-consoled") are accurate — keep them.

## 7. `chromeOn` has no control

It's a real field on `TThemeTokens` and the most visually consequential single
toggle in the whole theme (it's what makes the site look like a terminal). The
mock only implies it via preset choice. Add an explicit toggle in Advanced,
labelled around "terminal chrome", defaulting from the chosen preset.

## 8. Voice tab — 8 fields shown, 19 exist; two are invented

The mock invents **"Publish confirmation"** (`:555`) and **"No search
results"** (`:569`). Remove both — the second is especially misleading because
**there is no search feature on the site**.

The real set is 19 fields in 4 groups (source: `packages/studio/src/schema-types/
documents/settings/voice.ts`, being ported to Postgres — the field set carries
over unchanged). Use these groupings and names:

**404 page** (5) — `notFoundMetaTitle`, `notFoundMetaDescription`,
`notFoundCommandNotFound`, `notFoundDescription`, `notFoundReturnHome`

**Terminal prompts** (7) — `terminalPromptHost`, `authPromptCommandSignIn`,
`authPromptCommandAccount`, `bookmarksPromptCommand`,
`accountPrivacyPromptCommand`, `accountNewsletterPromptCommand`,
`accountIdentityPromptCommand`

**Bookmarks** (2) — `bookmarkToastSavedMessage`, `bookmarkToastRemovedMessage`

**Empty states** (5) — `blogListEmpty`, `topicEmpty`, `tagEmpty`,
`topicsEmpty`, `bookmarksEmpty`

(An earlier revision of this brief also listed `authorEmpty` — dropped:
`apps/web/src/app` has no author-listing route, only a byline field on
individual posts, so there is no empty state for it to back. #2200.)

Pull human-readable labels from that schema file's `title` properties rather
than inventing new ones. Each field is an **override**: empty means "inherit
from the preset's voice pack", so every input needs a visible placeholder
showing the inherited value and clearing an input must read as "revert to
preset", not "set to blank".

## 9. The mock overstates its own fidelity

Line 175 claims the Console preset "is driven by the real Tailwind design
tokens from" the repo. It isn't — see §1. Either make it true or delete the
claim; a mock that asserts fidelity it doesn't have is worse than one that
doesn't claim it.

## 10. "Uploading to hosted Studio" contradicts a settled decision

Line 828 references a hosted Sanity Studio. `SPEC.md` §13 settles that the
Studio is **Vercel-hosted and never deployed via `sanity deploy`**. Reword or
remove.

## 11. Favicon upload is missing

The data model has both `logoAssetUrl` and `faviconAssetUrl` (both Vercel Blob).
The mock only handles the logo. Add favicon upload beside it, noting the
favicon is expected **pre-cropped square** — Vercel Blob has no on-the-fly
image transforms, unlike the Sanity CDN, so whatever is uploaded is what ships.

## 12. Tenants list stays; add-tenant becomes explicitly disabled

This one is a **change of intent, not a factual correction** — it follows a
decision recorded in the product-design doc.

- **Keep the tenants list exactly as designed.** It ships from the start,
  reading the real `tenants` table, rendering one row. It is not a placeholder
  and must not be gated behind a "coming soon" state. Search/filter chrome may
  be omitted while the list is one row long; the page itself may not.
- **Keep the tenant switcher**, showing one option.
- **The add-tenant wizard is deferred** — it drives provisioning, which depends
  on the tenant-resolution layer that is deliberately sequenced last. Its entry
  point should render **visibly disabled with a stated reason**, not hidden and
  not linking to a working wizard. Keep the wizard screens in the mock as
  design reference; just make the entry state honest.

---

# Round 2 — findings against the revised mock (v2)

Items 1–12 above are **applied and verified correct**: HSL is fully gone, the
OKLCH ramps and logo tokens match production exactly, radius/density/font sets
and `PRESET_REGISTRY` defaults all match, the 20 voice fields are exact in name
and grouping, favicon and logo-hue controls exist, and add-tenant is disabled
with a stated reason while the tenants list ships for real. What follows is new.

> **§13–§15 applied 2026-08-13** — fixed directly in the mock and verified in a
> browser. Kept here as the record of why, since the reasoning binds the real
> `apps/platform` build too, not just the mock.

## 13. Dark mode is wired as a property of the preset — it isn't

`state.dark` is assigned in exactly one place: `state.dark = d.dark` on preset
change, from `PRESET = { CONSOLE: {…dark:true}, EDITORIAL: {…dark:false} }`.
There is no independent control. So picking Console forces a dark preview and
picking Editorial forces a light one, and **a tenant can never preview the
other mode**.

`TThemeTokens` has no `dark` field, and it shouldn't: dark mode is a _viewer_
preference, not tenant configuration. `build-theme-style-block.ts` emits both a
`:root {}` and a `.dark {}` block for whichever preset is chosen — precisely
because both modes must work for every preset. An Editorial tenant's readers
absolutely can be in dark mode.

**Fix:** remove `dark` from the `PRESET` object entirely and add a
light/dark toggle on the preview panel itself, independent of preset. It
controls which of the two ramps the preview renders — it is a property of the
_preview_, not of the tenant's saved config, and should read that way in the UI
(a preview affordance, not a settings field).

## 14. The preview prompt keys off dark mode instead of chrome

`pvPrompt` switches between `'~$ ./publish'` and `'guest@northwind ~ %'` based
on `state.dark`. Terminal voice is a function of `chromeOn` (and the voice
pack), not of the color scheme. Key it off `state.chrome`. This is the same
conflation as §13, just surfacing in a second place — worth fixing together.

## 15. Sidebar milestone badges are inconsistent

Subscribers and Comments carry a "later" badge; Domain, Email, Team, and Danger
zone carry none — which reads as "those four ship now." Per the product-design
doc, **only Look and Voice ship this milestone**; all six others are
design-now/build-later. Badge all six the same way, or badge none of them and
rely on the two "this milestone" badges to carry the distinction.

## 16. Two ramp tokens are unused (minor — note, don't necessarily fix)

`accentTokens()` returns `primary`/`solid`/`contrast` but omits
`--brand-primary-hover` and `--brand-primary-muted` (see §1's table for values).
Harmless while the preview has no hover states. If the inline preview samples
gain hover or muted-surface treatments, add them then — a preview whose hover
color is invented would reintroduce exactly the §1 problem.

## Out of scope for this revision

Don't restructure the navigation, don't redesign the two-tier live preview
(inline samples + reserved full-page iframe panel), and don't add pages. Tabs
beyond Look and Voice are intentionally designed-but-unbuilt.
