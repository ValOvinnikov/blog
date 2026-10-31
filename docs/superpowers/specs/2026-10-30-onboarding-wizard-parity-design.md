# Onboarding wizard: W2 parity

Design of record for bringing the `/onboarding` setup wizard into line with the
W2 boards, element by element. W2 was chosen earlier and shipped in #6196 and
#6206. Manual QA on 30 Oct found that the build drifted from the boards in
style and that some parts were never built at all: the phone segmented stepper
is the user-reported example. This document comes from a parity audit of the
four W2 boards against the code at `373e0a491`, revised the same day against
the cross-set resolutions (`2026-10-30-admin-redesign-resolutions.md`), the user's 30 Oct decisions and
the gap boards drawn afterwards (§1).

**The rule for this work: the boards win.** A value in a table below is copied
from the board source and is never rounded. Where the code differs, the code
changes. Where boards from different directions disagree, the user's 30 Oct
precedence rule picks the source (§2). No element is dropped silently: every
numbered element (E1–E142, P0–P14) appears in the acceptance checklist in §17,
either to build or as retired with the reason, and every ticket in §16 names
the elements it owns.

## 1. Sources

| Board (file / name)                                     | Viewport           | State shown                                                                                                                                        |
| ------------------------------------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wizard-W2-side-rail-step1` ("Setup wizard site step")  | 1440×900           | Step 1 **Site** is current. Site type Blog, name "Field Notes". Continue only.                                                                     |
| `wizard-W2-side-rail-step3`                             | 1440×900           | Step 3 **Look** is current; steps 1–2 are done. Editorial is selected, accent hue 16 (`#c2552e`; illustrative, see D-31). Back + Continue.         |
| `wizard-W2-side-rail-step4`                             | 1440×900           | Step 4 **Review** is current; steps 1–3 are done. Terms unchecked. Back + Create site.                                                             |
| `wizard-W2-side-rail-phone` ("Setup wizard look phone") | 390×1400           | Step 3 **Look** on a phone: dark header with a 4-segment stepper, fields, preview, bottom action bar.                                              |
| `gap-onboarding-rail-tier`                              | 1024×768, 768×1024 | Step 3 in the Rail tier: frame A at main's scroll top with the footer pinned; frame B the narrowest Rail width (content 340px, toolbar wrapping).  |
| `gap-onboarding-device-frame-preview`                   | 1440, 1024, 390    | The wizard preview as the shared LX device frame: A Full step 1 Desktop 37%; B Full step 3 Tablet 56%; C Rail 1024 Desktop 44%; D phone Phone 85%. |
| `gap-onboarding-field-error`                            | 1440×900           | A: step 1 after Continue with an empty Site name. B: step 2 after the check returns "taken".                                                       |
| `gap-onboarding-dark`                                   | 1440, 390          | Step 3 in the admin's Dark theme; rail and phone header unchanged from W2.                                                                         |
| `gap-theme-token-dark-values` (theme set)               | —                  | Dark values for the shared preview toolbar, stage and device frame tokens; supersedes `gap-onboarding-dark`'s provisional toolbar values.          |

Canvas: the Admin redesign canvas, https://claude.ai/artifact/LVch29ZcSE9Lh5T3Cocm9J.
The user reviewed the W2 phone board at
https://claude.ai/artifact/UxrBMqcjxCi7jaDe94paMY.

**What each board settles, where they overlap.**

- The W2 boards are the source for the rail, phone header, main column,
  fields, preset cards, accent row, Review step and the preview **column and
  wrapper** (E66, E113). Their browser-chrome preview (old E67–E87,
  E114–E127) is **not** the target: the user replaced it with the shared
  device frame (X21), drawn on `gap-onboarding-device-frame-preview`.
- `gap-onboarding-device-frame-preview` settles everything inside the preview
  (P1–P14, §11). `gap-onboarding-rail-tier` draws its preview provisionally:
  its address beside the heading and its "Sign in" link give way to the
  device-frame board, as the rail-tier board's own note says.
  `gap-onboarding-field-error` and `gap-onboarding-dark` draw the old preview
  as a backdrop; their preview is not the target either.
- `gap-onboarding-dark` settles the wizard's own colours in Dark; the preview
  toolbar's dark values come from `gap-theme-token-dark-values`. Its preview
  stage geometry is a backdrop too: the 390 frame's 12px stage padding, 1px
  `#2b303a` stage border and "shown at 81%" are not the target; the stage
  keeps §11.3's padding and no border in both themes (§11.5).

The boards load Inter 400/500/600/700, Fraunces 500/600 and JetBrains Mono 500.
The admin chrome uses the body font already set in the app. The Fraunces and
JetBrains Mono values below apply only inside the preset minis, the sample site
and the address readout (P6).

**What the boards still do not draw.** This work does not invent designs for
these; each keeps today's behaviour:

- the Address step (step 2) at rest: its fields are drawn only in
  `gap-onboarding-field-error` B (§8.2, E136–E138), and the rest state is that
  frame without the error. Its rail is drawn there too (§5.2, E139–E142);
- pending ("Creating your site…") and the failure alert, which keep today's
  behaviour inside the new shell;
- the Select popup and hover on buttons, which keep the shared primitives'
  styles. The one drawn hover is link hover `#3730a3`;
- the Review step on a phone (§10).

**Frames to draw before filing** (the 30 Oct rule: frames no board drew are
drawn before filing, so nothing is improvised in the build). Each blocks the
ticket named:

| Frame to draw                                | What it draws                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Blocks |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| `gap-onboarding-dark-steps`                  | The wizard in the Dark admin theme on the steps `gap-onboarding-dark` leaves out, at 1440 and 390: step 1 (select trigger, chevron, inputs), step 2 (address suffix, verdict chip), both field-error states (the `bad-line` border and the error text on `surface` #171a20) and step 4 Review (row rules, Edit links and their hover, terms links, checkbox). `gap-onboarding-dark`'s own CSS sets links to #a5b4fc with hover #c7cdfd (which reads as `brand-ink`); Light's #4f46e5 links would fail AA on #171a20, so the Dark link colour must be drawn, not assumed | #6333  |
| `gap-onboarding-device-frame-rail` (frame E) | The Rail tier at 768×1024, step 3, with the final preview toolbar: the address readout (P6) instead of the provisional address beside the heading, no "Sign in", the size readout, and how the toolbar wraps in the 340px content column (P5). `gap-onboarding-rail-tier` B draws only the provisional toolbar                                                                                                                                                                                                                                                          | #6332  |
| `gap-onboarding-field-error` B, redrawn      | Only if D-25 keeps the error in the verdict chip: frame B redrawn with the chip in the footer and no inline error                                                                                                                                                                                                                                                                                                                                                                                                                                                       | #6325  |

### 1.1 Baseline after #6301

#6293 merged as PR #6301 (`060cb2890`) after the audit. It is closed and is no
longer a ticket in this set. What it shipped, and what still differs from the
boards (each difference is owned by a ticket in §16):

| Shipped in #6301                                                                                                     | Board                                                                                         | Owner                       |
| -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------- |
| Shared `SegmentedProgress` on Base UI `Progress`, in the phone top band, sharing `toStepProgressState` with the rail | kept                                                                                          | —                           |
| The progressbar is named by its visible label ("Step 3 of 4 · Look"), so the step is heard twice                     | named "Setup steps", value text "Step 3 of 4 · Look", visible text hidden (§6)                | #6326                       |
| Segments fully rounded; phone band wraps on one row with `py-3` and a bottom border                                  | segments radius 2px; header is a column 16/16/18 with a 14px gap and no border (§6)           | #6326                       |
| Rail beside content from `md` (768) at 260px, 300px from `xl`                                                        | 300px at every Rail and Full width                                                            | #6327                       |
| Three columns from `xl` (1280) with a 480px preview, 560px from `2xl`                                                | Full from 1360 with a 560px preview (§4)                                                      | #6327                       |
| Page scrolls; actions `sticky bottom-0` at every width, before the preview in the DOM                                | Full/Rail: main scrolls, footer pinned; phone: action bar in flow after the preview (§7)      | #6327                       |
| Site type and name pair side by side once the column is 28rem wide (container query)                                 | always stacked (§8, D-13)                                                                     | #6325                       |
| Card-free white step column                                                                                          | kept; padding, cap and type per §7                                                            | #6327                       |
| Phone/Rail edge at `md` (768); phone header, rail and preview already on dark `side` values                          | kept; the 768 edge does not move. The `side` values are copied into `rail` tokens first (§14) | #6321, #6322                |
| Address suffix `.<root domain>` already its own element beside the input, listed first in the input's description    | kept; only its size (14px), the hint's place and the description order change (§8.2)          | #6325                       |
| `Your site` / `your-site` placeholders in the preview while the name and slug are empty                              | kept (D-20); only the readout's place changes (§11)                                           | #6332                       |
| Account block with Sign out in the rail when the user has an email; email hidden below `lg`                          | email shown from 768 and Sign out's phone-band margin kept below 768                          | #6305 (before #6327, #6322) |

**#6305** is filed (`prio:next`, `cloud-ok`) as a bug under the epic and lands before #6327 and #6322, which edit the same files (`onboarding-form-variants.ts`, `signed-in-account-variants.ts`). Its two halves: a focused field must stay visible above the pinned actions, and the rail must show the account email from 768 to 1023px. #6305 covers the phone (390px and landscape) and the rail email only; following D-5 the phone action bar is in flow after the preview, so #6327 retires its phone case. The Full and Rail rule, that the pinned footer never hides a focused field, is #6327's own criterion, tested at 1440×700 and 820×700. #6197, the manual test of the pre-W2 wizard, is superseded by #6334.

## 2. Settled decisions

- **Precedence (user, 30 Oct).** Shell structure comes from SH1, colour and
  tokens from TH1, cards and pills from dashboard layout B, the tooltip from
  layout B's look; page-specific designs: onboarding = W2. The preview is the
  shared LX device frame on both Look and onboarding. Frames no board drew are
  drawn before filing (§1).
- **Shared preview (user, 30 Oct).** The LX device-frame preview — true device
  widths 1280 / 820 / 390 scaled to fit, the icon toolbar for device and
  Light/Dark with aria-labels and tooltips, the sample header switching by
  frame width via container queries, no Newsletter specimen — is introduced
  once (#6390), adopted by Look (#6426), then by onboarding
  (#6332), in that order. Onboarding keeps a readout of the chosen site
  address, because the address is what the wizard is choosing, and leaves out
  the reader switch and the follow control (§11).
- **Colours are TH1's.** Wizard chrome uses admin tokens, so #6288's TH1 light
  values reach it: control borders are `control-line` (#818a99 today, #878f9d
  after #6288; the boards' #818a99 is dropped everywhere, X14). The rail and
  the phone header keep W2's dark values in **both** admin themes (TH1 item 6,
  `gap-onboarding-dark`); because #6288 turns the sidebar's `side` tokens grey,
  the rail moves to its own `rail` tokens first (§14): #6321 adds them,
  #6322 moves the wizard onto them and #6323 the Choose a workspace
  page. "#6288" here means its body as the theme set rewrites it, carrying the
  whole TH1 light palette with the grey `side` values; its GitHub body today
  covers only the card header, control borders and switcher and leaves the grey
  sidebar to #6291, and it is replaced before this set is filed.
- The phone stepper is the shared `SegmentedProgress` (#6293, merged). The
  stepper appears only in the phone header; desktop shows progress through the
  vertical step list and the "Step N of 4" line.
- The sample site is rendered with real `@blog/ui` components (the
  `site-preview/` exception in CLAUDE.md), so it cannot drift from `apps/web`.
  In the wizard it is the Look page's LX sample (§11.4).
- All copy here is `apps/platform` UI copy, which is never Voice.
- `apps/platform` has no Storybook. Visual changes are covered by the
  manual-test issue, which compares each board frame side by side with the
  build. Unit tests never assert a pixel value, colour or class
  (`testing-practices` → "What not to test"); they cover behaviour only:
  which step is current, what moves on a step change, accessible names,
  values and descriptions, and DOM order.
- A variant or size whose only consumer is the wizard ships in the PR of that
  consumer (§15).
- This doc lands on `main` with the other reconciled specs in #6314 before
  any ticket in §16 is dispatched, so every "spec § N" and element number a
  ticket cites resolves. It is deleted only after the manual-test issue
  closes, in the docs PR that syncs the feature page (§16).
- **No implementation ticket is filed until every open decision in §3 is
  answered and every frame in §1's draw-before-filing list is drawn.** Each
  ticket body is written once, with the settled decision stated plainly; it
  never says "blocked on", "per D-x" or "edited if the user answers
  otherwise". Until then the ticket drafts carry a bracketed
  `[pending D-n: …]` or `[undrawn: …]` marker exactly where the answer goes,
  naming the options; the marker is replaced by the answer before filing.
  Where this doc gives a value for an open decision it is the
  recommendation, and the row says the decision is open.
- The work is one epic, "the onboarding wizard matches the W2 boards", and
  every ticket in §16 is filed as its sub-issue.

## 3. Decisions

Status of every decision D-1 to D-33 after the resolutions and the gap boards.
"Board" names the frame that settles it; "rule" names the precedence row;
"user" is a 30 Oct decision. Values elsewhere in this doc state the answer.

| #    | Question                                         | Status     | Answer                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ---- | ------------------------------------------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-1  | Width tiers between 391 and 1439px               | board      | `gap-onboarding-rail-tier`: **Phone** below 768; **Rail** 768–1359 (rail 300 + main, preview stacked in main under the fields); **Full** from 1360 (300 / `minmax(0,1fr)` / 560).                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| D-2  | Stepper semantics                                | user       | One Base UI `progressbar` named "Setup steps" (`onboardingForm.stepsAriaLabel`), min 0, max 4, value = the current step's number, `aria-valuetext` "Step 3 of 4 · Look" (`stepProgressNamed`); the visible E94 text and the segments are `aria-hidden`.                                                                                                                                                                                                                                                                                                                                                                                                   |
| D-3  | Account block (`SignedInAccount surface="rail"`) | user       | **Decided 31 Oct: keep the account block as a stated deviation (desktop rail foot; phone brand row, right end), so sign-out stays reachable.** No board draws it. Recommended: keep it (desktop rail foot; phone brand row, right end) so sign-out stays reachable; recorded as a stated deviation. The block is built today; on a phone it shows only Sign out. Its email from 768 is #6305's.                                                                                                                                                                                                                                                           |
| D-4  | Scroll model in the Full and Rail tiers          | board      | W2 900px frame and `gap-onboarding-rail-tier` A: the page never scrolls; main scrolls inside itself; footer `sticky bottom-0` on white, padding 20px 0 40px; the rail (and the Full preview column) does not scroll. Phone: the page scrolls as one column. A focused field stays visible above the footer: #6305's scroll-margin requirement, kept by #6327.                                                                                                                                                                                                                                                                                             |
| D-5  | Phone action bar                                 | board      | In flow after the preview (W2 phone): the page scrolls as one column, so the bar never covers a focused field on a phone (#6305's phone case is retired by #6327).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| D-6  | Slider value text                                | user       | **Decided 31 Oct: "hue 16°" (`logoHueField.hueValue`, no new key); it reads better for screen readers.** Board names the hex ("#c2552e"). Recommended: "hue 16°" (`logoHueField.hueValue`), because a hex read aloud means nothing.                                                                                                                                                                                                                                                                                                                                                                                                                       |
| D-7  | Review swatch accessible name                    | user       | **Decided 31 Oct: "hue 16°", matching D-6; no `accentSwatchLabel` key.** Board: "Accent colour #c2552e" (new key `onboardingForm.accentSwatchLabel`). Recommended: "hue 16°", matching D-6, no new key.                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| D-8  | Preview CTA colour before the Look step          | user       | **Decided 31 Oct: the starter preset's accent on steps 1–2, as device-frame A draws.** W2 step 1 draws `#4f46e5`; `gap-onboarding-device-frame-preview` A draws the starter accent. Recommended: the starter preset's accent on every step (`#c2552e` for a Blog).                                                                                                                                                                                                                                                                                                                                                                                        |
| D-9  | Preview chrome in Dark                           | user       | Retired with the browser chrome (X21). The device frame's toolbar follows the admin theme; the site inside follows the preview's own Light/Dark (§11.5).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| D-10 | Hue track gradient                               | board      | The board's pure rainbow `#ff0000,#ff8000,#ffff00,#00c000,#00c0c0,#0060ff,#8000ff,#ff00c0,#ff0000` (W2 step 3, phone), in the wizard only; the Look page's slider keeps `accentHueGradient()`.                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| D-11 | Sample site                                      | user       | The shared LX sample with real `@blog/ui` (§11.4). W2's mock sample values are retired, not deviations.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| D-12 | Phone sample posts                               | user       | The shared sample's post cards; W2's 72×56 thumbnail rows are not built (Out of scope).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| D-13 | Site step fields side by side                    | board      | Stacked at every width (W2 step 1); #6301's container-query pairing is removed.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| D-14 | Rail landmark                                    | rule       | One `header`, an `ol` named "Setup steps", no `nav` (`platform-ui-practices` bans a nav around a list with no links). The boards' `nav` is not built.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| D-15 | Shared rail parts used by the workspace picker   | rule       | The picker is on no chosen board, so it stays as it is: the wizard sizes reach `RailBrand` / `RailIntro` / `BrandMark` through a prop. The picker also stays dark (it moves to the `rail` tokens with the wizard, §14).                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| D-16 | Preset picker anatomy                            | rule (X20) | The wizard takes W2's card anatomy (#6329, in `SH/preset-picker/`). The Look page takes LX's compact strip (#6425, built in `features/look/look-form/components/preset-card/`, which stops rendering the shared picker on the Look page; #6395 extends it). Because the Look page's use of the picker changes under both, X20 and resolutions § 4 keep #6425 and #6395 never in parallel with #6329. Until #6425 lands, the Look page shows the W2 card.                                                                                                                                                                                                  |
| D-17 | Button shadow                                    | board      | No shadow on the wizard's `LG` buttons.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| D-18 | FormField hint position                          | rule (X18) | Hint below the control in the wizard only, through a FormField option. Other admin forms keep the hint above.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| D-19 | Sample header extras                             | user (X21) | Superseded: the shared sample header follows the tenant (Look D-34). In the wizard: three-layer mark, name, Posts / About / Topics, language switcher, theme toggle, no Sign in; name plus Menu under 1024px of frame width (§11.4).                                                                                                                                                                                                                                                                                                                                                                                                                      |
| D-20 | Preview address before step 2                    | user       | **Decided 31 Oct: keep the `your-site.[root-domain]` placeholder; no slug derived from the name.** The W2 board shows `field-notes.[root-domain]` on step 1, which needs a slug derived from the name (new behaviour). Recommended and drawn on `gap-onboarding-device-frame-preview` A: `your-site.[root-domain]` until a slug is typed.                                                                                                                                                                                                                                                                                                                 |
| D-21 | Order of a field's hint and error                | board      | `gap-onboarding-field-error`: label, control, hint, error; `aria-describedby` lists the hint, then the error (§8.1).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| D-22 | Main content width at ≥ 1600                     | user       | **Decided 31 Oct: approved: cap at 640px, left-aligned.** Cap the step label, h1, fields stack and footer at 640px, left-aligned inside main's padding; main's white still fills the column. `gap-onboarding-rail-tier` draws the cap's lower half (596px at 1024).                                                                                                                                                                                                                                                                                                                                                                                       |
| D-23 | A done step for assistive tech                   | user       | **Decided 31 Oct: approved: sr-only "Complete" on done rows, new key `onboardingForm.stepComplete`.** Each done row carries sr-only "Complete" after its label: new key `onboardingForm.stepComplete`.                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| D-24 | Sample site in a narrow preview                  | user       | The device frame's scale rule replaces the 480px browser switch: the sample is always laid out at the device width and scaled (§11.3).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| D-25 | Where the taken-address error shows              | user       | **Decided 31 Oct: the taken-address error inline under the hint, as frame B draws; the chip keeps checking, available and unverified.** `gap-onboarding-field-error` B's drawing and its note disagree. The drawing puts "This address is taken. Choose another." inline under the hint (12px / 500 `#b42318`, `id` `site-address-error`), the input `aria-invalid` with `aria-describedby` "suffix hint error", and a footer of Back and Continue with no chip. The note says the error "stays in the verdict chip". Recommended: the drawing, the same order as frame A and D-21; the chip keeps its other verdicts. Otherwise frame B is redrawn (§1). |
| D-26 | Accent row and slider height below 768           | user       | **Decided 31 Oct: 44px below 768 (thumb top 12px), in Light and Dark.** `wizard-W2-side-rail-phone` draws them 36px (thumb top 8px); `gap-onboarding-dark` 390 draws them 44px (thumb top 12px) and says so. A size is not a Dark change, so it holds in both themes and belongs to the accent-row ticket. Recommended: 44px, the platform phone-target rule (§4).                                                                                                                                                                                                                                                                                        |
| D-27 | Phone header bottom border in Dark               | user       | **Decided 31 Oct: the Dark board's 1px `#1c1f26` bottom border, in Dark only.** W2 phone (E89) has none; `gap-onboarding-dark` 390 draws a 1px `#1c1f26` (`rail-line`) bottom border, while its notes and §14.1 call the header "identical to Light". Recommended: the Dark board's border, in Dark only, because it is the only Dark drawing and separates `#0f1115` from `#171a20`.                                                                                                                                                                                                                                                                     |
| D-28 | Cookie-settings button in the wizard's sample    | user       | **Decided 31 Oct: shown, as drawn (a new site's starting value).** Every `gap-onboarding-device-frame-preview` frame draws the sample's floating round button (44px circle at left 16 / bottom 16 in sample px, white, 1px `#ece4d8` border, shadow `0 4px 12px rgba(28,26,23,.14)`, 20px cookie icon). On Look it shows only when "Cookie settings button = Shown". Recommended: shown, as drawn, because it is the new site's starting value.                                                                                                                                                                                                           |
| D-29 | Scrolling the sample inside the frame            | user       | **Decided 31 Oct: shared behaviour: wheel, trackpad and touch scroll the inert sample and the scrollbar shows whenever it does not fit.** Frame D draws the shared scrollbar (`aria-hidden`, right 3 / top 4 / bottom 4, 5px wide, track `rgba(18,20,26,.08)`, thumb `#5b6472` at top 0, height 52%), so its 718px frame scrolls; frames A–C draw none although their samples are taller than the viewport, and Look's rule shows one whenever the sample does not fit. Recommended: the shared behaviour — wheel, trackpad and touch scroll the inert sample and the scrollbar shows whenever it does not fit (A–C were drawn unscrolled).               |
| D-30 | Height that bounds the frame in the Full tier    | user       | **Decided 31 Oct: the Full stage's inner height.** P9 says the frame fits the stage's width and height but not which height. Look's shared rule caps `availableHeight` at 608px; device-frame B (Tablet 458×659 at 0.559) is taller than 608, so the wizard does not use that cap, and A and B are width-bound, so neither settles it. Recommended: the Full stage's inner height (the stage fills the 900px column, P7). It decides the Phone device's scale in the Full tier and the Tablet scale in short windows.                                                                                                                                     |
| D-31 | Accent swatch colour                             | user       | **Decided 31 Oct: keep the shared oklch formula; the swatch is checked against the colour the Review swatch and preview show, not `#c2552e`.** The boards' `#c2552e` at hue 16 cannot be produced by the shared accent formula (hue 16 renders a deeper red; Editorial starts at hue 28). Recommended: keep the formula, so the wizard, Review and Look swatches agree; the boards' hex is an illustration, not a target.                                                                                                                                                                                                                                 |
| D-32 | Wizard preview language switcher (X-W2-10)       | user       | **Decided 31 Oct: the wizard keeps the switcher, through the `alwaysShowLanguageSwitcher` option on the shared Look sample (#6397 adds it).**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| D-33 | Onboarding states no board draws (W2-undrawn)    | user       | **Decided 31 Oct: the Review terms error, Review at 390, "Creating your site…" and the failure alert are drawn as frame `gap-onboarding-review-states` before #6331 and #6334 are filed; the tickets check those states against it.**                                                                                                                                                                                                                                                                                                                                                                                                                     |

Confirm-only items are recommendations no board settles and no rival
contradicts; the user approves them in one answer. One more board-drawn choice
goes in the same answer: in the wizard the desktop frame's bar shows only its
dots, because the address readout already sits above the frame (§11.3, P8).

## 4. Frames and breakpoints

| Tier  | Width      | Layout                                                                                                                                          | Drawn                                                                 |
| ----- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Phone | < 768      | One column: dark header (brand, progress text, stepper) → white main (h1, fields) → preview block → action bar                                  | W2 phone 390 (F4); device-frame D; dark 390                           |
| Rail  | 768 – 1359 | Rail 300 + white main. Main holds the step label, h1, fields, then the preview (§11.1), then the pinned footer; same scroll model as Full (D-4) | `gap-onboarding-rail-tier` A (1024×768), B (768×1024); device-frame C |
| Full  | ≥ 1360     | Rail 300 · main `minmax(0,1fr)` · preview 560, full viewport height                                                                             | W2 1440 (F1–F3); device-frame A, B; field-error A, B; dark 1440       |

Below `md`, the phone rules in `platform-ui-practices` still hold: text fields
are 16px and touch targets are 44px. The board's 44px phone buttons and toggles
agree with them.

The tier edges are checked at 767/768 and 1359/1360. The rail's phone/desktop
switch lives in `onboarding-rail-variants.ts` (`root`, `brand`, `intro`,
`progress`, `list`, `account` slots), at `md` since #6301 — the Phone/Rail
edge already. The shell ticket keeps it there and moves the form's own `xl`
switch to 1360.

**How the tier is decided.** The Full and Rail tiers differ in DOM order, not
only in geometry: the preview comes after the footer in Full and before it in
Rail (§12), and CSS `order` would move it on screen without moving keyboard
focus. So the form reads the tier in JS with the existing
`apps/platform/src/utils/use-media-query/` `useMediaQuery`, at the same 48rem
(768) and 85rem (1360) edges the CSS uses, and renders the preview once, in its
tier's place. DOM order is then the visual and the keyboard order in every
tier. The hook's server value is false, so the server renders the Phone/Rail
order, and the Full tier never shows the preview inside main before it takes
its column. Unit tests choose a tier by stubbing `matchMedia`, as
`look-form.test.tsx` does, and assert DOM order and the preview's initial
device per tier; no test reads a class.

In the Full and Rail tiers the step label, h1, fields stack, preview (Rail) and
footer are capped at 640px and left-aligned inside main's padding (D-22). At
1440 the content is 452px; at a 1024 window 596px; at 768, 340px. The cap only
acts from about 1630px (Full) and a main wider than 768px (Rail).

## 5. Desktop rail (Rail and Full tiers), F1–F3

### 5.1 Box

| Element              | Property     | Value                                                                                                                                                  |
| -------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| E2 rail              | width        | 300px, `flex:none`                                                                                                                                     |
|                      | background   | `#0f1115` (`--admin-rail`, §14; the same in Light and Dark)                                                                                            |
|                      | border-right | 1px solid `#1c1f26` (`--admin-rail-line`)                                                                                                              |
|                      | padding      | 28px 24px                                                                                                                                              |
|                      | layout       | flex column; full viewport height, sticky (code today, kept)                                                                                           |
| E3 brand row         | layout       | flex, `align-items:center`, gap 10px                                                                                                                   |
| E4 brand mark        | box          | 28×28, radius **6px** (`rounded-admin`), `linear-gradient(to bottom right,#6366f1,#a855f7)`                                                            |
|                      | text         | "V", `#ffffff`, 700, **15px**, centred, `aria-hidden`                                                                                                  |
| E5 wordmark          | text         | "Valstack", 700, 16px, `letter-spacing:0.2px`, `#ffffff`                                                                                               |
| E6 intro             | layout       | `margin-top:44px`, flex column, gap 8px                                                                                                                |
| E7 intro title       | text         | "Create your site", **20px / 600**, `#ffffff`, **line-height 1.3**, margin 0, element `p` (not a heading)                                              |
| E8 intro description | text         | 13px, `#c9cfda`, **line-height 1.55**                                                                                                                  |
| E9 steps list        | spacing      | `margin-top:32px`; an `ol` with no `nav` (D-14), keeping its accessible name "Setup steps" (`onboardingForm.stepsAriaLabel`, `aria-label` on the `ol`) |
| E10 `ol`             | layout       | `list-style:none`, margin 0, padding 0, flex column, gap 4px                                                                                           |
| Below the list       | —            | the account block only (D-3, decided 31 Oct; recommended: kept, `margin-top:auto`, `padding-top:32px`, as today)                                       |

### 5.2 Step rows (every `li`)

`display:flex`, gap 12px, padding 10px 12px, **radius 6px** (`rounded-admin`; today 4px).

| State                           | Row                                         | Circle (24×24, `flex:none`, round, centred)                                                                                                                               | Label                                       | Summary                                                                              |
| ------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------ |
| Upcoming                        | `align-items:center`, no background         | **border 1.5px solid `#7d8696`**, number `#7d8696`, **12px / 600**                                                                                                        | 14px / 500, `#7d8696`                       | —                                                                                    |
| Current (`aria-current="step"`) | `align-items:center`, background `#20242e`  | border 2px solid `#a5b4fc`, number `#a5b4fc`, 12px / 600                                                                                                                  | 14px / **600**, `#ffffff`                   | —                                                                                    |
| Done                            | **`align-items:flex-start`**, no background | filled `#a5b4fc`, holding an **SVG tick**: 14×14, viewBox 0 0 24 24, `stroke:#0f1115`, `stroke-width:3`, round caps and joins, `fill:none`, path `M5 12.5l4.5 4.5L19 7.5` | 14px / 500, `#c9cfda`, **line-height 24px** | 12px, `#7d8696`, below the label; text column is flex column, gap 2px, `min-width:0` |

Rows per frame:

| Frame | Row 1                                 | Row 2                                          | Row 3                       | Row 4                    |
| ----- | ------------------------------------- | ---------------------------------------------- | --------------------------- | ------------------------ |
| F1    | E11 current "1" Site                  | E12 upcoming "2" Address                       | E13 upcoming "3" Look       | E14 upcoming "4" Review  |
| F2    | E15 done Site · "Blog · Field Notes"  | E16 done Address · "field-notes.[root-domain]" | E17 current "3" Look        | E18 upcoming "4" Review  |
| F3    | E19 done Site · "Blog · Field Notes"  | E20 done Address · "field-notes.[root-domain]" | E21 done Look · "Editorial" | E22 current "4" Review   |
| F6 B  | E139 done Site · "Blog · Field Notes" | E140 current "2" Address                       | E141 upcoming "3" Look      | E142 upcoming "4" Review |

F6 B is step 2 as `gap-onboarding-field-error` B draws it; F1 and F6 B
together cover steps 1–4 with F2 and F3.

Every rail colour in this section is a `rail` token (§14), so it reads the same
in both admin themes (`gap-onboarding-dark`).

Done rows also carry a visually hidden "Complete" after the label (D-23), so
assistive tech hears "Site, Complete, Blog · Field Notes". The current row keeps
`aria-current="step"`. Upcoming rows carry nothing extra.

`[root-domain]` is `TENANT_ROOT_DOMAIN` at runtime. Summaries may truncate with
an ellipsis (code today). The board does not truncate, but it never overflows
at 300px either.

## 6. Phone header and stepper (Phone tier), F4

| Element               | Property        | Value                                                                                                                                                                         |
| --------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E89 header            | box             | background `#0f1115` (`--admin-rail`), padding **16px 16px 18px**, flex **column**, gap **14px**, **no border-bottom**                                                        |
| E90 brand row         | layout          | flex, `align-items:center`, gap 10px                                                                                                                                          |
| E91 brand mark        | box             | **26×26**, radius **6px**, same gradient; "V" 700 **14px** `#ffffff`                                                                                                          |
| E92 wordmark          | text            | "Valstack", 700, 16px, `letter-spacing:0.2px`, `#ffffff`                                                                                                                      |
| E93 progress block    | layout          | flex column, gap **10px**, full width                                                                                                                                         |
| E94 progress text     | text            | "Step 3 of 4 · Look" (`stepProgressNamed`), **13px / 600**, `#c9cfda`, margin 0, `aria-hidden="true"` (the stepper carries the same text, D-2)                                |
| E95 stepper           | layout          | the shared `SegmentedProgress`; full width; 4 equal segments; gap **6px**; margin 0, padding 0; `role="progressbar"` named "Setup steps", `aria-valuetext` = E94's text (D-2) |
| each segment          | box             | `flex:1`, height **4px**, radius **2px**                                                                                                                                      |
| E96 Site (done)       | colour          | `#a5b4fc` (`--admin-rail-accent`)                                                                                                                                             |
| E97 Address (done)    | colour          | `#a5b4fc`                                                                                                                                                                     |
| E98 Look (current)    | colour          | `#ffffff`                                                                                                                                                                     |
| E99 Review (upcoming) | colour          | `#20242e` (`--admin-rail-raised`)                                                                                                                                             |
| —                     | absent on phone | intro title and description; vertical step list. The account block stays at the right end of the brand row, as today (D-3, decided 31 Oct)                                    |
| —                     | Dark            | `gap-onboarding-dark` 390 adds a 1px `#1c1f26` bottom border in Dark (D-27, decided 31 Oct)                                                                                   |

Segment colours on every step (the board draws step 3):

| Current step | Site      | Address   | Look      | Review    |
| ------------ | --------- | --------- | --------- | --------- |
| 1 Site       | `#ffffff` | `#20242e` | `#20242e` | `#20242e` |
| 2 Address    | `#a5b4fc` | `#ffffff` | `#20242e` | `#20242e` |
| 3 Look       | `#a5b4fc` | `#a5b4fc` | `#ffffff` | `#20242e` |
| 4 Review     | `#a5b4fc` | `#a5b4fc` | `#a5b4fc` | `#ffffff` |

Segment states follow the rail's state rule (`toStepProgressState`, shared by
the rail and `SegmentedProgress` since #6301): steps before the current one are
done, the current one is current, and the rest are upcoming. Reuse that rule;
do not derive it again. The stepper updates on every step change, including Back and a jump from
Review's Edit.

## 7. Main column

### 7.1 Box

| Element                 | Full / Rail tier                                                                                                                                                                                                                                          | Phone tier                                                              |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| E23 / E100 main         | background `surface` (`#ffffff`; `#171a20` in Dark, §14.1), padding **56px 64px 40px** as drawn, built as 56px 64px 0 with the 40px in the footer (§7.2, D-4), flex column, full height, scrolls inside itself, **no card** (no border, radius or shadow) | background `surface`, padding **24px 16px 28px**, flex column, no card  |
| E24 step label          | "Step N of 4" (`stepProgress`), **13px / 600**, `#5b6472`, margin 0                                                                                                                                                                                       | **absent** (it moves into the header)                                   |
| E25 / E101 h1           | step name; **28px / 600**, `letter-spacing:-0.2px`, line-height 1.2, **6px** below E24                                                                                                                                                                    | step name; **24px / 600**, line-height 1.2, no letter-spacing, margin 0 |
| E26 / E102 fields stack | `margin-top:32px`, flex column, gap **28px**                                                                                                                                                                                                              | `margin-top:20px`, gap **24px**                                         |

In the Full and Rail tiers E24–E27 sit in a column capped at 640px (D-22).

The focus target that receives focus on a step change (`panelRef`, `tabIndex=-1`)
stays and wraps the step label, h1 and fields. The failure alert stays as the
first child of the fields stack.

### 7.2 Footer (Full and Rail tiers), E27

| Property             | Value                                                                                                                                                                                                                                                                                                    |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| position             | inside main, `margin-top:auto`, `position:sticky; bottom:0` (D-4)                                                                                                                                                                                                                                        |
| box                  | opaque background `surface` (`#ffffff`; `#171a20` in Dark, §14.1, so it always matches main), padding 20px 0 40px, `border-top:1px solid #eef0f3` (`line-2`), flex, gap 12px; the content scrolls under it unseen, and the 40px of ground below the buttons (E23's bottom padding) stays while scrolling |
| step 1               | `justify-content:flex-end`; Continue only                                                                                                                                                                                                                                                                |
| steps 2–4            | `justify-content:space-between`; Back on the left, primary on the right                                                                                                                                                                                                                                  |
| Address verdict chip | stays between Back and Continue (not drawn; today's behaviour)                                                                                                                                                                                                                                           |

### 7.3 Phone action bar, E128

| Property                  | Value                                                                                                                                                                            |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| position                  | **after the preview**, the last block of the page, in flow (D-5)                                                                                                                 |
| box                       | background `surface` (`#ffffff`; `#171a20` in Dark), padding 16px, `border-top:1px solid #e5e7eb`, flex, gap 12px                                                                |
| E129 Back / E130 Continue | **height 44px**, **`flex:1` each** (equal width, filling the bar); padding 0 18px (Back) and 0 20px (Continue) as on desktop; same borders, colours and 600 14px text as §7.4    |
| step 1                    | Continue alone, full width (Back is not rendered)                                                                                                                                |
| Address verdict chip      | step 2 only: inside the bar, on its own full-width line above the two buttons (the bar becomes a column: chip, then the button row, 12px apart). Matches today's phone placement |

### 7.4 Buttons (new Button size `LG`)

|            | Secondary (Back)                                      | Primary (Continue, Create site)          |
| ---------- | ----------------------------------------------------- | ---------------------------------------- |
| type       | `button`                                              | `submit` / `button` as today             |
| height     | **40px** (44px below `md`, from the primitive)        | 40px (44px below `md`)                   |
| padding    | 0 18px                                                | 0 20px                                   |
| border     | 1px solid `control-line` (X14; `#737d8d` Dark)        | 1px solid `brand` (as the fill)          |
| radius     | 4px                                                   | 4px                                      |
| background | `surface`: `#ffffff` Light, `#171a20` Dark            | `brand`: `#4f46e5` Light, `#5850ec` Dark |
| text       | `text`: `#12141a` Light, `#e8eaef` Dark; **600 14px** | `#ffffff`, 600 14px                      |
| shadow     | none (D-17)                                           | none (D-17)                              |

## 8. Site step (F1) and field typography

| Element               | Property          | Value                                                                                                                                                                                                                                                                                                                         |
| --------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E28 / E34 field group | layout            | flex column, gap **6px**                                                                                                                                                                                                                                                                                                      |
| E29 / E35 label       | text              | **13.5px / 600**, `#12141a`; `label[for]` bound to the control                                                                                                                                                                                                                                                                |
| E31 site-type control | box               | width 100%, height **40px**, border 1px `control-line` (X14), radius 4px, background `#fff`, text `#12141a` **400 14px**, padding **0 40px 0 12px** (the 40px right padding keeps long options such as "Personal / résumé" clear of the chevron; 16px text below `md`), single line with an ellipsis when the label overflows |
|                       | options, in order | Blog (selected), Portfolio, Personal / résumé, Docs, Blank                                                                                                                                                                                                                                                                    |
|                       | description       | `aria-describedby` = its hint                                                                                                                                                                                                                                                                                                 |
| E32 chevron           | icon              | 16×16, viewBox 24, stroke `#5b6472`, width 2, round caps and joins, path `M6 9l6 6 6-6`, 12px from the right, vertically centred (top 12px), `pointer-events:none`                                                                                                                                                            |
| E33 hint              | text              | "Your site starts with pages for this type.", 12px, `#5b6472`, **line-height 1.45**, **below** the control (D-18)                                                                                                                                                                                                             |
| E36 site-name input   | box               | height 40px, border 1px `control-line`, radius 4px, 400 14px, padding 0 12px (16px below `md`), value "Field Notes"                                                                                                                                                                                                           |
| E37 hint              | text              | "Shown in your site’s header and in browser tabs.", same style, **below** the input                                                                                                                                                                                                                                           |
| layout                | —                 | the two fields are **stacked** at every width (D-13; #6301's container-query pairing goes)                                                                                                                                                                                                                                    |
| E38                   | —                 | Continue (primary), footer right                                                                                                                                                                                                                                                                                              |

The control stays the Base UI `Select` (`OptionSelect`). Only its trigger must
look like E31/E32. The popup is not drawn and keeps its styles. The Address
step's fields are §8.2.

### 8.1 Field errors (`gap-onboarding-field-error`)

| Element                    | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E131 order                 | label, control, hint, error (D-21). The hint keeps its place directly below the control whether or not an error shows                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| E132 invalid control       | `aria-invalid="true"`, border 1px `#dd6152` (`bad-line`); `aria-describedby` lists the hint, then the error                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| E133 Site name error       | "Enter a name for your site." (`onboardingForm.fieldErrors.nameRequired`, the only name error the app has), 12px / 1.45, 500, `#b42318` (`bad`), text only, no icon, 6px below the hint (the field gap). Frame A: step 1 after Continue with an empty name                                                                                                                                                                                                                                                                                                                        |
| E134 Address error         | **D-25, decided 31 Oct: the drawing.** Drawn (frame B): "This address is taken. Choose another." (`fieldErrors.siteAddressTaken`) inline under the hint, 12px / 1.45, 500, `#b42318`, the input `aria-invalid` with the `bad-line` border, described by the suffix, the hint, then the error; the footer shows Back and Continue with no chip. Frame B's note: the message stays in the verdict chip between Back and Continue (today's placement), the input described by the suffix, the hint, then the chip message. Reserved and invalid addresses follow whichever is chosen |
| E135 preview while invalid | step 1 with an empty name: the sample shows the placeholder name "Your site" (`previewNamePlaceholder`) and the address `your-site.[root-domain]` (D-20)                                                                                                                                                                                                                                                                                                                                                                                                                          |

Contrast: `#b42318` on `#ffffff` 6.5:1; on the chip `#fdeceb` 5.9:1; hint
`#5b6472` on `#ffffff` 6.1:1. No new strings.

### 8.2 Address step fields (`gap-onboarding-field-error` B)

The only drawing of step 2's fields. Label, hint and error sizes are §8's.

| Element                  | Value                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E136 address control row | label "Site address" (`onboardingForm.siteAddressLabel`) bound to the input; under it a flex row, `align-items:center`, gap **8px**: the input (`flex:1`, `min-width:0`, 40px, 1px `control-line`, radius 4, 400 14px, padding 0 12px; 16px / 44px below `md`), then the suffix `.[root-domain]` as a **separate element outside the input**, 14px `#5b6472`, `flex:none`, with an `id` the input's `aria-describedby` lists first |
| E137 address hint        | "Letters, numbers and hyphens. You can connect your own domain on the Growth plan." (`onboardingForm.siteAddressHint`), §8 hint style, below the row; the input is described by the suffix, then the hint, then the error (D-25)                                                                                                                                                                                                   |
| E138 Language field      | label "Language" (`onboardingForm.languageLabel`); the E31/E32 select trigger and chevron (40px, padding 0 40px 0 12px); options English, Dutch, French, German, Spanish, English selected; hint "The language your site starts in. You can add more later." (`onboardingForm.languageHint`) below it, as its description                                                                                                          |
| layout                   | the two fields stacked in the fields stack (gap 28px Full/Rail, 24px Phone)                                                                                                                                                                                                                                                                                                                                                        |

## 9. Look step (F2, F4)

### 9.1 Preset group

| Element         | Property  | Value                                                                                                                                                                                                                                                 |
| --------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E39 group       | semantics | a radio group whose accessible name is **"Look"** (the visible label) and which is described by the hint E44. Today it is named "Preset". The Look settings page keeps "Preset" (the group name is passed by the caller).                             |
|                 | layout    | flex column, gap 6px, no border, margin or padding, `min-width:0`                                                                                                                                                                                     |
| E40 group label | text      | a **visible** `legend` "Look", 13.5px / 600, `#12141a`, padding 0, `margin-bottom:6px`; the legend is not a flex item, so the group's 6px gap does not apply to it and the cards start **6px below the legend**. It names the group (no `aria-label`) |
| E41 card row    | layout    | **two columns at every width**; gap **14px** (Full/Rail), **10px** (Phone, E103); each card `flex:1`, `min-width:0` (about 174px each at 390)                                                                                                         |
| E44 hint        | text      | "A starting style for your site. You can fine-tune it after it’s created.", **below** the cards, `margin-top:4px` on top of the group's 6px gap, so **10px below the cards**, 12px, `#5b6472`, line-height 1.45                                       |

### 9.2 Preset card anatomy (shared by both cards)

Order, top to bottom: **mini preview**, then the **footer row**.

| Part                 | Property  | Value                                                                                                                                                                                                                                                                                                     |
| -------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| card                 | box       | radius **6px**, background `surface` (`#fff`; `#171a20` in Dark, §14.1), padding **8px**, flex **column**, gap **10px**, `cursor:pointer`, `position:relative`                                                                                                                                            |
| radio                | semantics | a real radio in the group (Base UI `Radio.Root`), named by the preset name and described by its description; checked = selected                                                                                                                                                                           |
| mini                 | box       | height **72px**, radius 4px, padding 8px, flex column, gap 4px, content starts at the top (no `justify-content`; today's `justify-center` goes), `overflow:hidden`, `aria-hidden`; text wider than the card ("Dispatches from the coast" in a 174px phone card) is clipped at the right edge, no ellipsis |
| mini · nav row       | layout    | `justify-content:space-between`; left: logo bar 22×3, radius 2px, opacity .7; right: three bars 9×3, radius 2px, gap 4px                                                                                                                                                                                  |
| mini · title         | text      | **13px**, line-height **15px**, `white-space:nowrap`                                                                                                                                                                                                                                                      |
| mini · tagline       | text      | **10.5px**, line-height **13px**, `white-space:nowrap`                                                                                                                                                                                                                                                    |
| mini · skeleton      | layout    | flex column, gap 3px; two bars 3px tall, radius 2px, widths **80%** and **55%**                                                                                                                                                                                                                           |
| footer row           | layout    | flex, `align-items:flex-start`, gap 8px, padding 0 4px 4px                                                                                                                                                                                                                                                |
| footer · text        | layout    | `flex:1`, flex column, gap 2px                                                                                                                                                                                                                                                                            |
| footer · name        | text      | **14px / 600**, `#12141a`                                                                                                                                                                                                                                                                                 |
| footer · description | text      | **12.5px**, `#5b6472`, line-height 1.4                                                                                                                                                                                                                                                                    |
| footer · radio dot   | box       | 18×18, round, at the **right** of the footer row                                                                                                                                                                                                                                                          |

### 9.3 Preset card states

|                       | E42 / E104 Console (unselected in F2/F4)                                                    | E43 / E105 Editorial (selected in F2/F4)                                                      |
| --------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| card border           | **1px solid `#e5e7eb`** with `margin:0.5px` (keeps the outer size equal to a selected card) | **1.5px solid `#4f46e5`**, margin 0, `box-shadow:0 0 0 3px #eef2ff`                           |
| radio                 | value `console`                                                                             | value `editorial`, **checked**                                                                |
| mini background       | `#0f1115`                                                                                   | `#fbf7f0`                                                                                     |
| logo bar              | `#c9cfda`                                                                                   | `#6f655b`                                                                                     |
| nav and skeleton bars | `#2a2f3a`                                                                                   | `#e6ddd0`                                                                                     |
| title                 | "Build Log", JetBrains Mono **500**, **`#4f9cf0`**                                          | "Field Notes", Fraunces **600**, `#2a2320`                                                    |
| tagline               | "Shipped without drama", `#c9cfda`                                                          | "Dispatches from the coast", **`#6f655b`**                                                    |
| name                  | "Console"                                                                                   | "Editorial"                                                                                   |
| description           | "Mono, precise and technical."                                                              | "Serif, warm and magazine-like."                                                              |
| radio dot             | empty ring, border 1.5px `control-line`                                                     | filled `#4f46e5`, holding a **white SVG tick** 12×12, stroke 3, path `M5 12.5l4.5 4.5L19 7.5` |

Either card may be the selected one. The states move with the selection.
Keyboard focus keeps the shared focus-visible ring on the card.

This is the wizard's card (X20). The Look page renders the shared
`PresetPicker` today through `features/look/look-form/components/preset-card/`,
so until #6425 replaces that with LX's strip the Look page shows this
card and keeps its group name "Preset". #6425 and #6395 build the
strip inside `preset-card/` and never edit `SH/preset-picker/`, so they share
no file with the wizard tickets.

### 9.4 Accent row

| Element               | Property  | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| --------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E45 / E107 block      | layout    | flex column, gap **10px**                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| E46 / E108 label      | text      | "Accent colour", 13.5px / 600, with an `id` the slider references                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| E47 row               | layout    | flex, `align-items:center`, gap **14px**, height **36px** from 768; below 768 44px (`gap-onboarding-dark` 390; D-26, decided 31 Oct)                                                                                                                                                                                                                                                                                                                                                              |
| E48 / E109 slider     | semantics | `role=slider`, `aria-labelledby` = E46, min 0, **max 360** (`HUE_MAX`), now = hue (the chosen preset's: 28 for Editorial, 250 for Console; the boards draw 16), `aria-valuetext` "hue N°" from `logoHueField.hueValue` (D-6, decided 31 Oct); focusable; arrow keys move it (Base UI)                                                                                                                                                                                                             |
|                       | box       | `flex:1`, the row's height (D-26 below 768), `cursor:pointer`                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| E49 / E110 track      | box       | 100% wide, **12px** tall, radius **6px**, the board's pure rainbow `linear-gradient(to right,#ff0000,#ff8000,#ffff00,#00c000,#00c0c0,#0060ff,#8000ff,#ff00c0,#ff0000)` (D-10), a wizard option on `HueSlider`; the Look page keeps `accentHueGradient()`                                                                                                                                                                                                                                          |
| E50 / E111 thumb      | box       | 20×20, round, `#ffffff`, **border 1px `rgba(16,24,40,.12)`**, **`box-shadow:0 1px 3px rgba(16,24,40,.25)`**; centred on the value (`left: hue/360`, `margin-left:-10px`), top 8px in a 36px row (12px in a 44px one). The ring is the shared #6337 helper's (#6339 puts the slider on it); it shows on `:focus-visible` only, never while dragging or at rest (today's `data-[dragging]:ring-2` goes). Dark values: §14.1                                                                         |
| **E51 / E112 swatch** | box       | **new**: 20×20, radius 4px, background = the current accent, the colour `buildAccentPreviewTokens(hue, false)['--brand-primary']` gives (the boards' `#c2552e` at hue 16 is illustrative, D-31), border 1px `#e5e7eb`, `aria-hidden`, right of the slider; updates live as the slider moves. It is the shared `AccentSwatch` (§15): the third swatch of the accent, after Review's E60 and the Look page's Colour card swatch, so #6330 extracts the component and moves both existing ones to it |

## 10. Review step (F3)

| Element    | Property | Value                                                                                                                                                                                                                                                                                                                                                    |
| ---------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E54 list   | element  | `dl`, margin 0                                                                                                                                                                                                                                                                                                                                           |
| row (each) | box      | a `div` holding `dt` + `dd` only (a `dl > div` may contain nothing else), with Edit **inside the `dd`** as the board draws; flex, `align-items:center`, gap 16px, **min-height 52px**, **border-bottom 1px `#eef0f3`**; the **first row also border-top 1px `#eef0f3`**                                                                                  |
| `dt`       | text     | **width 120px**, `flex:none`, **13px**, `#5b6472`                                                                                                                                                                                                                                                                                                        |
| `dd`       | text     | margin 0, `flex:1`, flex, `align-items:center`, gap 8px, **14px / 500**, `#12141a`, body font (**no row is monospace**)                                                                                                                                                                                                                                  |
| Edit       | control  | the last child of the `dd`; text "Edit", accessible name "Edit {field}"; **link-styled `button`** (it changes the step, it does not navigate); `margin-left:auto`; **13.5px / 600** in the shared text-link colour and hover (`#4f46e5` / `#3730a3` in Light; the colour is #6337's); no underline; padding 0 4px; min 36×36; centred; shared focus ring |

| #   | dt           | dd                                              | Edit name         |
| --- | ------------ | ----------------------------------------------- | ----------------- |
| E55 | Site type    | Blog                                            | Edit Site type    |
| E56 | Site name    | Field Notes                                     | Edit Site name    |
| E57 | Site address | field-notes.[root-domain] (body font, not mono) | Edit Site address |
| E58 | Language     | English                                         | Edit Language     |
| E59 | Look         | Editorial + **E60** swatch                      | Edit Look         |

E60 swatch: 16×16, radius 4px, background = accent, border 1px `#e5e7eb`,
`role="img"`, named "hue N°" from `logoHueField.hueValue` (D-7, decided 31 Oct). It sits 8px after the preset name (the `dd` gap).

The bordered rows are a wizard variant on `SH/detail-list`, built on the
layout B metrics #6356 gives every detail list; the 120px term and 14px /
500 value are W2's, because onboarding's page design is W2 (precedence rule).

| Element       | Property | Value                                                                                                                                                                                                                                                                                                                        |
| ------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E61 terms row | layout   | flex, `align-items:flex-start`, gap **10px**; it is the next item of the fields stack after the E54 `dl`, so it sits **28px** below the list's last rule (the stack gap; 24px below 768)                                                                                                                                     |
| E62 checkbox  | box      | **18×18**, `margin-top:1px`, checked colour `#4f46e5`; unchecked on the board                                                                                                                                                                                                                                                |
| E63 label     | text     | "I agree to the Terms of Service and the Privacy Policy.", **14px**, line-height 1.45, `text` `#12141a` (inherited from main; `#e8eaef` in Dark); the two phrases are links in `#4f46e5` (hover `#3730a3`) with the default underline (the board sets `text-decoration:none` only on Edit), opening the legal pages as today |
| E64 / E65     | footer   | Back (secondary) + "Create site" (primary), §7.4                                                                                                                                                                                                                                                                             |

The board draws no phone Review. Below `md` the rows keep the flex layout with
the 120px `dt`, and Edit grows to 44×44.

## 11. Preview

The wizard adopts the shared LX device-frame preview (X21). The shared parts —
`PreviewFrame`'s heading row and readout, the `PreviewToolbar` with its icon
groups and tooltips, `DeviceFrame` and its scale rule, the LX sample — are
introduced by #6390 and first adopted by Look in #6426; their
values live in the Look spec § 12. This section states what the wizard adds,
leaves out and shows. W2's browser-chrome preview (old E67–E87, E114–E127, the
`#c9ced6` chrome dots, the 480px container switch and the compact chrome
segmented variant) is retired and is not built.

### 11.1 Column and wrapper (shell-owned)

| Element              | Full tier                                                                                                  | Rail tier                                                                                                                               | Phone tier (E113)                                                                                                                                  |
| -------------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| E66 column / wrapper | width **560px**, `flex:none`, background `#f6f7f9` (`bg`), padding **32px 28px**, flex column, full height | none: the preview sits in main, **32px** below the fields stack, as wide as the content column (≤ 640px), no grey ground, no top border | full width, `#f6f7f9`, padding **20px 12px 24px**, border-top 1px `#e5e7eb`, `flex:1` so its ground fills the page between main and the action bar |
| P0 section           | `flex:1`, flex column, gap **12px**; fills the column                                                      | flex column, gap 12px, as tall as its content                                                                                           | flex column, gap **10px**, as tall as its content                                                                                                  |

The column and wrapper belong to the shell (#6327); everything from the
section inward belongs to the preview (#6332), P0's gap and fill included:
#6327 moves today's section as it is, and #6332's criteria carry P0.

### 11.2 Heading row and toolbar

| #   | Element         | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| P1  | heading row     | flex, `align-items:baseline`, `justify-content:space-between`, gap 12px: `h2` "Live preview" 15px / 650 `#12141a`, which labels the section, then the readout. The wizard keeps "Live preview" and the long readout at **every** width (the phone frame draws them in a 366px section), so it does not use the shared row's narrow "Preview" form                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| P2  | size readout    | `role="status"`, "{width} px wide · shown at {percent}%", JetBrains Mono 12px `#5b6472`, one line. Drawn: Full Desktop "1280 px wide · shown at 37%" (A), Full Tablet "820 px wide · shown at 56%" (B), Rail 1024 Desktop "1280 px wide · shown at 44%" (C), Rail 768 Desktop 24% (rail-tier B), phone Phone "390 px wide · shown at 85%" (D)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| P3  | toolbar row     | `role="toolbar"` "Preview options", flex, wraps, gap 8px: the **Device** group ("Preview device": Desktop, Tablet, Phone), the **Colour scheme** group ("Preview colour scheme": Light, Dark), a spacer, then the address readout (P6). **No Reader group, no Follow, no Full screen.** One Tab stop with roving focus, as the shared toolbar                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| P4  | toolbar buttons | the shared icon toggle buttons: 30×30 in a track (padding 2, gap 2, `#eef0f3`, 1px `control-line` border, radius 5); pressed white with a 1.5px `#4f46e5` inset ring and a `#3730a3` icon; tooltips "Desktop · 1280 px", "Tablet · 820 px", "Phone · 390 px", "Light", "Dark". **44×44 below `md`** (D)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| P5  | wrapping        | Full and Rail ≥ 1024: one row. Rail 768 (340px content): **undrawn** — `gap-onboarding-rail-tier` B draws only the provisional toolbar (address beside "Live preview", size readout on its own right-aligned line); frame E is drawn before #6332 is filed (§1). Recommended: the groups on the first line and the address on the next. Phone: the address takes its own full-width line under the 44px buttons                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| P6  | address readout | the chosen address, closing the toolbar row: `inline-flex`, `align-items:center`, gap **6px**, `min-width:0`; a 14px globe icon (`ICONS.GLOBE`, stroke `#5b6472`, `aria-hidden`), a visually hidden "Site address" (`onboardingForm.siteAddressLabel`), then the address 6px after the globe in JetBrains Mono 12px / 18px, 500, `#12141a`, one line, no wrap. An address wider than its line (about 504px left in the Full toolbar row, the 366px phone line) is cut with an ellipsis at its end (`overflow:hidden`, `text-overflow:ellipsis`, as `gap-onboarding-dark` draws its readouts); the globe never shrinks, the readout never wraps or overflows its line, and the whole address stays its accessible text. Before a slug is typed: D-20, decided 31 Oct (drawn on A: `your-site.[root-domain]`, `previewAddressPlaceholder`); then `<slug>.[root-domain]`, following the slug as it is typed on step 2 |

### 11.3 Stage and device frame

| #   | Element       | Value                                                                                                                                                                                                                                                                                                                                                                                                               |
| --- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P7  | stage         | the shared stage: `#eef0f3`, radius 6, padding **16px** (Full, Rail), **10px** (phone); content top-aligned and centred. Full: `flex:1`, filling the column below the toolbar                                                                                                                                                                                                                                       |
| P8  | device frame  | the shared `DeviceFrame`, `role="img"` "Sample page at {width} px". Desktop: the 28px bar with three 8px dots and, **in the wizard, no host** (the address is already P6; drawn on A, in the §3 confirm-only batch), using the option to leave the host out that #6390 builds into the shared frame; Tablet and Phone: the shared bezels                                                                            |
| P9  | scale         | the shared rule laid out at the device width, scaled to fit. Full: the frame fits the stage's width and the Full stage's inner height (D-30, decided 31 Oct; not Look's 608px cap, which B exceeds; recommended: the Full stage's inner height) (A: 470×294 at 0.367; B: Tablet 458×659 at 0.559). Rail: by width (C: 562×351 at 0.439; rail-tier B: 308 wide at 0.24). Phone: by width (D: Phone 332×718 at 0.851) |
| P10 | initial state | Desktop in the Full and Rail tiers; Phone in the Phone tier; Light pressed; the frame opens at the top of the page and the status line stays empty. The device and scheme choices persist across steps: Continue, Back and an Edit from Review keep the pressed device and scheme (F3)                                                                                                                              |

### 11.4 What the frame shows

| #   | Element        | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| --- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P11 | sample content | the Look page's LX sample, built from real `@blog/ui` parts: heading "Reading the tide charts" and text, Subscribe, Read more, the busy button ("Sending…"), "Latest posts" with two post cards and the "4 min read" chip, and the footer. **No Newsletter card.** It wears the wizard's choices: the typed name (or "Your site" while empty), the preset and the accent                                                                                                                                                                                                                                                         |
| P12 | sample header  | brand mark (no logo yet, so the three-layer mark in the theme's logo tones), the site name, Posts, About and Topics, the language switcher and the theme toggle. Reader accounts start off, so **no Sign in**. Under 1024px of **frame** width it switches by container query to the name plus Menu (B, D)                                                                                                                                                                                                                                                                                                                       |
| P13 | inertness      | the site inside the frame takes no clicks or focus and its headings stay out of the admin outline. Whether wheel, trackpad and touch scroll it inside the frame, and when the scrollbar shows (drawn on D only), is D-29 (decided 31 Oct). Wherever it shows, its track and thumb (`frame-track`, `frame-thumb`) follow the preview's own Light/Dark, not the admin theme (§11.5)                                                                                                                                                                                                                                                |
| P15 | cookie button  | every frame draws the sample's floating cookie-settings button (44px circle, left 16 / bottom 16 in sample px, white, 1px `#ece4d8`, shadow `0 4px 12px rgba(28,26,23,.14)`, 20px cookie icon); whether a new site's sample shows it is D-28 (decided 31 Oct; recommended: shown)                                                                                                                                                                                                                                                                                                                                                |
| P14 | starter look   | on steps 1–2 the sample wears the site type's starter preset (`STARTER_PRESET_BY_SITE_TYPE`), as device-frame A draws: Editorial for a Blog (Fraunces, the `#fbf7f0` ground, the three-layer mark in Editorial's logo tones), Console for Docs. Until the user picks a preset or moves the slider, a Site type change on step 1 re-dresses the sample in the new type's starter preset (today's `changeSiteType` rule); afterwards the chosen look stays. The CTA colour on steps 1–2 is the starter preset's accent (D-8, decided 31 Oct; drawn on device-frame A); from step 3 the sample follows the preset and accent slider |

Inherited from the shared preview: the header follows the frame width by
container queries; whether the sample's footer and post cards must also follow
the frame width is Look's open D-9 follow-on, and the wizard takes whatever it
settles.

### 11.5 Dark

The toolbar, stage and frame chrome follow the admin theme with the values of
`gap-theme-token-dark-values` (they arrive with the shared preview's tokens).
The site inside the frame follows the preview's own Light/Dark switch, never
the admin theme, so Light stays pressed in both admin themes until the user
presses Dark. The frame's scrollbar sits on the sample, so it follows the
preview's scheme too, not the admin theme: Light track `rgba(18,20,26,.08)`,
thumb `#5b6472`; Dark track `rgba(232,234,239,.14)`, thumb `#a3abb8`
(`frame-track`, `frame-thumb`, `gap-theme-token-dark-values`).

Dark changes colours only, never geometry: the stage keeps padding 16 (Full,
Rail) and 10 (Phone) with no border in both admin themes, so the frame's
scale and the size readout are the same as in Light (phone "390 px wide ·
shown at 85%"). `gap-onboarding-dark` 390's 12px padding, 1px `#2b303a`
border, `#1d2027` ground and 81% are its provisional backdrop (§1); the
stage's Dark ground is the shared stage's, set with the shared preview's
tokens.

## 12. Accessibility

- **Landmarks:** one `main`. The rail is a `header` with no `nav` (D-14). The
  preview is a `section` labelled by its `h2` "Live preview".
- **Headings:** one `h1` per step (E25/E101). The rail title E7 is a `p`. The
  preview's `h2` follows the step content. The sample site's headings stay out
  of the outline (P13).
- **Step list:** an `ol` named "Setup steps", with the current row
  `aria-current="step"`. Number circles and tick glyphs are `aria-hidden`. Done
  rows carry sr-only "Complete" (D-23).
- **Phone stepper:** one `progressbar` named "Setup steps" whose
  `aria-valuetext` is "Step 3 of 4 · Look"; the visible E94 text and the
  segments are `aria-hidden` (D-2). The progress is heard once.
- **Names:** "Look" for the preset group, "Accent colour" for the slider
  (`aria-labelledby`), "Edit {field}" for each Edit, "Preview options" for the
  toolbar, "Preview device" and "Preview colour scheme" for its groups, each
  button by its `aria-label` with a tooltip, "Site address" before the
  readout's address, "Sample page at {width} px" for the frame.
- **Descriptions:** each control's hint via `aria-describedby`; with an error,
  the hint then the error (§8.1).
- **Readout:** `role="status"`, so a device change is announced politely.
- **Focus order, Full tier:** rail (account menu only, D-3) → step fields in
  visual order → footer Back → footer primary → preview toolbar (one Tab stop).
- **Focus order, Rail tier:** rail (account menu only) → step fields → preview
  toolbar → footer Back → footer primary, following the DOM (preview inside
  main, before the footer).
- **Focus order, Phone:** header (account menu only) → fields → preview toolbar
  → Back → Continue, following the DOM (preview before the action bar).
- On a step change, focus moves to the panel (`panelRef`), as today.
- **Targets:** at least 44×44 below `md` (buttons, toolbar buttons, Edit grows
  from 36 to 44). Desktop Edit is at least 36×36.
- **Contrast:** every text pair uses tokens that pass AA in both themes
  (`gap-onboarding-dark` lists the dark pairs: text 14.48:1, muted ≈ 7.6:1 on
  surface, readout 8.17:1 on bg, white on brand 5.56:1, control borders 4.19:1
  against the 3:1 rule). The phone upcoming segment `#20242e` on `#0f1115` is
  decorative; state is carried by the text and the ARIA.
- **Tooltips:** only the preview toolbar's, from the shared tooltip.

## 13. Copy

| String                                                                                                                                                          | Key                                                                   | Status                                                      | Voice?           |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------- | ---------------- |
| Valstack                                                                                                                                                        | `onboardingPage.brandName`                                            | existing                                                    | fixed (platform) |
| Create your site                                                                                                                                                | `onboardingPage.heading`                                              | existing                                                    | fixed            |
| Choose what kind of site you want, its address and its look. You can change everything except the address later.                                                | `onboardingPage.description`                                          | existing                                                    | fixed            |
| Setup steps                                                                                                                                                     | `onboardingForm.stepsAriaLabel`                                       | existing                                                    | fixed            |
| Site / Address / Look / Review                                                                                                                                  | `onboardingForm.steps.*`                                              | existing                                                    | fixed            |
| {siteType} · {name}                                                                                                                                             | `onboardingForm.siteSummary`                                          | existing                                                    | fixed            |
| Step {n} of {total} / Step {n} of {total} · {step}                                                                                                              | `onboardingForm.stepProgress` / `stepProgressNamed`                   | existing                                                    | fixed            |
| Site type / Your site starts with pages for this type.                                                                                                          | `onboardingForm.siteTypeLabel` / `siteTypeHint`                       | existing                                                    | fixed            |
| Blog / Portfolio / Personal / résumé / Docs / Blank                                                                                                             | `onboardingForm.siteTypes.*`                                          | existing                                                    | fixed            |
| Site name / Shown in your site’s header and in browser tabs.                                                                                                    | `onboardingForm.nameLabel` / `nameHint`                               | existing                                                    | fixed            |
| Enter a name for your site. / This address is taken. Choose another.                                                                                            | `onboardingForm.fieldErrors.nameRequired` / `siteAddressTaken`        | existing                                                    | fixed            |
| Look / A starting style for your site. You can fine-tune it after it’s created.                                                                                 | `onboardingForm.presetLabel` / `presetHint`                           | existing                                                    | fixed            |
| Accent colour                                                                                                                                                   | `onboardingForm.accentLabel`                                          | existing                                                    | fixed            |
| Console, Mono, precise and technical., Build Log, Shipped without drama, Editorial, Serif, warm and magazine-like., Field Notes, Dispatches from the coast      | `presetPicker.*`                                                      | existing                                                    | fixed            |
| Language / English                                                                                                                                              | `onboardingForm.languageLabel` / language name                        | existing                                                    | fixed            |
| Site address                                                                                                                                                    | `onboardingForm.siteAddressLabel` (also the readout's hidden label)   | existing                                                    | fixed            |
| your-site.{root} / Your site                                                                                                                                    | `onboardingForm.previewAddressPlaceholder` / `previewNamePlaceholder` | existing                                                    | fixed            |
| Edit / Edit {field}                                                                                                                                             | `onboardingForm.edit` / `editField`                                   | existing                                                    | fixed            |
| hue {hue}°                                                                                                                                                      | `logoHueField.hueValue` (slider value text, Review swatch name)       | existing; used only if D-6 / D-7 go to the recommendation   | fixed            |
| Letters, numbers and hyphens. You can connect your own domain on the Growth plan.                                                                               | `onboardingForm.siteAddressHint`                                      | existing                                                    | fixed            |
| The language your site starts in. You can add more later.                                                                                                       | `onboardingForm.languageHint`                                         | existing                                                    | fixed            |
| Accent colour {colour}                                                                                                                                          | `onboardingForm.accentSwatchLabel`                                    | **new only if D-7 goes to the board** (all five catalogues) | fixed            |
| Complete (sr-only, done rail rows)                                                                                                                              | `onboardingForm.stepComplete`                                         | **new only if D-23 is confirmed**, all five catalogues      | fixed            |
| I agree to the Terms of Service and the Privacy Policy.                                                                                                         | `termsAcceptance.acceptTerms`                                         | existing                                                    | fixed            |
| Back / Continue / Create site                                                                                                                                   | `onboardingForm.back` / `continue` / `createSite`                     | existing                                                    | fixed            |
| Live preview / Preview colour scheme / Light / Dark                                                                                                             | `previewModeControl.*`                                                | existing                                                    | fixed            |
| Desktop                                                                                                                                                         | `lookPreview.widthDesktop`                                            | existing                                                    | fixed            |
| Tablet, Phone, Preview device, Preview options, the three device tooltips, "{width} px wide · shown at {percent}%", "Sample page at {width} px", "Latest posts" | shared preview keys                                                   | new, **added by #6390 / #6426**, not by this set            | fixed            |
| sample site copy                                                                                                                                                | `lookPreview.*`                                                       | existing (the Look sample's)                                | fixed            |

No public-site copy is added or changed. This set adds at most two keys
(`stepComplete`, and `accentSwatchLabel` only if D-7 goes to the board).

## 14. Tokens

New, in `apps/platform/src/styles/admin-theme.css`, all from #6321, which is
first in the admin token chain (#6321 → #6288 → #6381 → #6403 →
#6291). The names are fixed here so every ticket uses the same utilities; no
ticket writes the raw value.

| Token                 | Value     | Utility                  | Used by                                                                   |
| --------------------- | --------- | ------------------------ | ------------------------------------------------------------------------- |
| `--text-admin-28`     | 28px      | `text-admin-28`          | E25 h1 (Full/Rail)                                                        |
| `--radius-admin-bar`  | 2px       | `rounded-admin-bar`      | E95 segments, preset mini bars (#6381 reuses it, never adds a second 2px) |
| `--admin-rail`        | `#0f1115` | `bg-admin-rail`          | rail, phone header, workspace picker rail                                 |
| `--admin-rail-line`   | `#1c1f26` | `border-admin-rail-line` | rail border, picker rules                                                 |
| `--admin-rail-text`   | `#c9cfda` | `text-admin-rail-text`   | intro description, done labels, phone progress text, account on the rail  |
| `--admin-rail-muted`  | `#7d8696` | `text-admin-rail-muted`  | upcoming rows, summaries                                                  |
| `--admin-rail-raised` | `#20242e` | `bg-admin-rail-raised`   | current row, upcoming segments, account hover on the rail                 |
| `--admin-rail-accent` | `#a5b4fc` | `bg-admin-rail-accent`   | done circles and segments, current ring                                   |

The six `rail` tokens hold today's `side` values and are the **same in Light
and Dark** (TH1 item 6). #6321 introduces them with no reader. #6322
repoints every onboarding use of `side*` to them (with the rail parts the
workspace picker shares: `rail-intro`, `rail-brand` and the `rail` account
surfaces), and #6323 the workspace picker's own rail, each with no visible
change and both before #6288, so #6288 (grey `side`) and #6291 (dark palette)
leave the rail as W2 draws it. The `side` tokens then belong to the admin
sidebar alone.

Retired with the browser chrome: `--color-admin-chrome-dot` and
`--radius-admin-chip` (3px).

**This table is #6321's token set.** `gap-theme-token-dark-values`'s note
("#6321 adds no colour after narrowing … 28px heading size and 2px and
3px radii") and the theme spec § 5.4 sentence repeating it are superseded
here: they predate the `rail` tokens, which TH1 item 6 needs once #6288
turns `side` grey, and the 3px radius they list is retired above. The six
`rail` colours have one value in both themes, so they need no Dark value and
are rightly absent from that board's table; #6291 adds none for them. The preview toolbar's tokens and their dark values
come from #6381 and #6291 (`gap-theme-token-dark-values`).

Existing tokens used: `surface`, `text`, `muted`, `control-line`, `line`,
`line-2`, `bg`, `brand`, `brand-strong`, `brand-weak`, `bad`, `bad-line`,
`shadow-admin`, `shadow-admin-lg`, `rounded-admin` (6px),
`rounded-admin-control` (4px), and text sizes 12, 12.5, 13, 13.5, 14, 15, 16,
20 and 24. #6288 adds `brand-ink`, which the selected preset card uses so it
reads `#a5b4fc` in Dark (§14.1).

Literals that stay as arbitrary values in variants, because they are
illustrative mock colours or sizes, as in the preset minis today: `#4f9cf0`,
`#2a2f3a`, `#6f655b`, `#e6ddd0`, `#fbf7f0`, `#c9cfda` (the Console mini's
tagline, which today borrows `side-text`), the brand-mark gradient
`#6366f1 → #a855f7`, the thumb's Light `rgba(16,24,40,.12)` / `rgba(16,24,40,.25)`
and Dark `#0f1115` / `rgba(0,0,0,.6)` (§14.1), the hue rainbow, 10.5px and 72px.

### 14.1 Dark (`gap-onboarding-dark`)

`gap-onboarding-dark` draws step 3 only. The other steps, the field errors and
Review in Dark are `gap-onboarding-dark-steps`, drawn before #6333 is
filed (§1); this table gains their rows then.

| Part                                 | Dark                                                                                                                                                  |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| rail, phone header                   | unchanged (`rail` tokens); the phone header's Dark bottom border is D-27 (decided 31 Oct)                                                             |
| main column                          | `surface` `#171a20`; text `#e8eaef`; step label, hints, card descriptions `muted` `#a3abb8`                                                           |
| pinned footer (E27)                  | ground `surface` `#171a20`, opaque like main, so fields still pass under it unseen; top rule `line-2` `#232730`                                       |
| Full preview column                  | `bg` `#0f1115`, with a 1px `line` `#2b303a` rule between main and the column (Light draws no rule)                                                    |
| phone preview wrapper (E113)         | `bg` `#0f1115`, top rule 1px `line` `#2b303a`                                                                                                         |
| phone action bar (E128)              | `surface` `#171a20`, top rule 1px `line` `#2b303a`                                                                                                    |
| hue thumb (E50 / E111)               | border 1px `#0f1115`, `box-shadow:0 1px 3px rgba(0,0,0,.6)`; the track is unchanged                                                                   |
| Back (LG secondary, 1440 and 390)    | ground `surface` `#171a20`, text `text` `#e8eaef`, border `control-line` `#737d8d`                                                                    |
| radio ring, inputs                   | `control-line` `#737d8d`                                                                                                                              |
| Continue / Create site               | `brand` `#5850ec`, white text                                                                                                                         |
| selected preset card                 | 1.5px `brand-ink` `#a5b4fc` border with a 3px `brand-weak` `#23244a` halo; the dot filled `#a5b4fc` with a `#0f1115` tick, as the rail's done circles |
| preset cards (both)                  | ground `surface` `#171a20`; the minis keep their own grounds                                                                                          |
| card and swatch borders              | `line` `#2b303a`                                                                                                                                      |
| preset minis, hue track, sample site | content, not chrome: unchanged in both themes                                                                                                         |
| preview stage                        | geometry unchanged (padding 16 / 10, no border, the same scale and readout as Light, §11.5)                                                           |

## 15. Code mapping

Path prefixes: `OF` = `apps/platform/src/components/features/onboarding/onboarding-view/components/onboarding-form`,
`SH` = `apps/platform/src/components/shared`, `LY` = `apps/platform/src/components/features/layout`.

| Ticket                 | Files                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Change                                                                                                                                                                                                                                                                                                                   |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| #6321 tokens           | `apps/platform/src/styles/admin-theme.css`; `docs/features/design-tokens-and-surfaces.md`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | §14 tokens, introduced with no reader                                                                                                                                                                                                                                                                                    |
| #6322 wizard on `rail` | the `side*` uses in `OF/components/onboarding-rail/**`, `OF/components/onboarding-preview/**`, `LY/rail-intro/*`, `LY/rail-brand/*`, `LY/signed-in-account/signed-in-account-variants.ts` (the `rail` and `railFooter` surfaces only), `SH/step-indicator/*` (on-dark states), `SH/segmented-progress/*` (on-dark tone), `SH/preset-picker/preset-picker-variants.ts` (Console mini text → literal). Stay on `side*`, because they sit on the admin sidebar and turn grey with #6288 by design: `LY/sidebar/**` (collapse toggle included), `LY/tenant-switcher/tenant-switcher-variants.ts`, `LY/topbar/components/topbar-nav-menu/topbar-nav-menu-variants.ts` (phone Menu), `LY/nav-item-content/nav-item-content-variants.ts`, `SH/avatar/avatar-variants.ts` (`switcher` variant); `signed-in-account-variants.ts` has no sidebar surface on main (an SH1 sidebar-foot account menu would be new and a later ticket's) | repoint, no visible change                                                                                                                                                                                                                                                                                               |
| #6323 picker on `rail` | `LY/dashboard-tenant-picker/dashboard-tenant-picker-variants.ts` (rail, footer, account rule)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | repoint, no visible change                                                                                                                                                                                                                                                                                               |
| #6326 phone header     | `OF/components/onboarding-rail/*`, `SH/segmented-progress/*`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | §6: header column, padding and gap, no border; progress block; segment radius; progressbar naming (D-2)                                                                                                                                                                                                                  |
| #6327 shell            | `OF/onboarding-form.tsx`, `OF/onboarding-form-variants.ts`, `OF/components/onboarding-rail/onboarding-rail-variants.ts` (rail width), `OF/components/onboarding-step-header/*`, `OF/components/onboarding-actions/*`, `SH/button/button-variants.ts` (size `LG`, whose only consumer is this wizard)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Tiers at 768/1360, read in JS with `useMediaQuery` so the preview renders once in its tier's place (§4); scroll model (D-4); main padding and 640px cap; step header type; fields stack; pinned footer; E66 column and E113 wrapper; today's preview moved above the footer in the Rail tier; phone order and action bar |
| #6328 desktop rail     | `OF/components/onboarding-rail/*`, `SH/step-indicator/*` (on-dark only, plus the sr-only done status), `LY/rail-intro/*`, `LY/rail-brand/*`, `SH/brand-mark/*` (two wizard values on its `size` variant: desktop 28 and phone 26)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | §5 values and the phone mark (E90–E92); tick icon; picker unchanged (D-15); "Complete" (D-23)                                                                                                                                                                                                                            |
| #6325 fields           | `SH/form-field/*` (hint-after-control option; D-21 order), `SH/text/text-variants.ts` (hint leading), `SH/option-select/*` and `SH/text-input/*` (a wizard size), `SH/form-text-input/*` (passes the opt-in to the Site name field; its four other users keep the hint above), `OF/components/site-details-fields/*` (drop only the `@[28rem]:grid-cols-2` pairing; the `@container` marker on `fields` stays until #6329 removes it with the picker's `@sm:`), `OF/components/address-step-fields/**` (`components/site-address-field/` included); per D-25 (decided 31 Oct), if the drawing is chosen, `OF/components/address-verdict/*` (no chip for the taken verdict), `OF/use-onboarding-wizard.ts` (where `addressVerdict` is built) and possibly `OF/use-field-error-text.ts`. After #6337, whose `bad-line` #dd6152 border and `bad` #b42318 text the shared invalid state then carries                            | §8, §8.1                                                                                                                                                                                                                                                                                                                 |
| #6329 preset cards     | `SH/preset-picker/*`, `OF/components/site-look-fields/*`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | §9.1–9.3                                                                                                                                                                                                                                                                                                                 |
| #6330 accent row       | `SH/hue-slider/*` (labelling, value text, thumb, a rainbow-track option), `OF/components/site-look-fields/*`, a new shared `SH/accent-swatch/` `AccentSwatch` (the accent from a hue, a size variant and an optional accessible name: `role="img"` when named, `aria-hidden` otherwise). It is the third copy, so both existing ones move to it in this ticket: `OF/components/review-step/*` (16px, E60) and `features/look/look-form/components/colour-card/colour-card.tsx` and `-variants.ts` (52px, unchanged look). #6392 (the 14×14 Colour summary swatch) and #6386's 12×12 phone swatch slot adopt it after this ticket, each adding its size, and depend on it. Never beside #6394, the other editor of `colour-card/`                                                                                                                                                                                            | §9.4                                                                                                                                                                                                                                                                                                                     |
| #6331 Review           | `OF/components/review-step/*`, `SH/detail-list/*` (a bordered-rows variant on #6356's metrics), `SH/checkbox/*` (an 18px size), `SH/button` (a link variant that reuses the `SH/text-link/text-link-variants.ts` colours #6337 sets)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | §10                                                                                                                                                                                                                                                                                                                      |
| #6332 preview          | `OF/components/onboarding-preview/**` (adopts `PreviewFrame`'s heading row, `PreviewToolbar` and `DeviceFrame`; the browser composition and `preview-address-bar/` are deleted; `site-preview/front-page-sample/`, `site-preview/sample-chip/` and the `lookPreview.readTimeChip` key are deleted with it), `SH/preview-frame/*` (an option to keep the long heading row at every width; the wizard is its only consumer). The desktop bar without its host is #6390's existing `device-frame/` option, adopted, not added                                                                                                                                                                                                                                                                                                                                                                                                  | §11 from the section (P0) inward                                                                                                                                                                                                                                                                                         |
| #6333 dark             | the wizard's variant files where a Dark value in §14.1 is not already a token (`OF/onboarding-form-variants.ts` preview-column rule, phone wrapper and action bar rules; `OF/components/onboarding-rail/*` header border if D-27 takes it; `SH/preset-picker/*` selected tone and card ground; `SH/hue-slider/*` thumb; the Back ground comes from the `LG` secondary in `SH/button/button-variants.ts`), plus whatever `gap-onboarding-dark-steps` draws among `SH/option-select/*`, `SH/text-input/*`, `OF/components/address-step-fields/*` (suffix), `OF/components/address-verdict/*` (verdict chip), `SH/detail-list/*` (bordered rows), `SH/button/*` (link variant) and `SH/checkbox/*`                                                                                                                                                                                                                             | §14.1                                                                                                                                                                                                                                                                                                                    |

The shared primitives whose look changes for every consumer are the
`PresetPicker` card (until #6425 gives Look its strip), the
`HueSlider` thumb and labelling, and the new `AccentSwatch`, which the Look
page's Colour card moves to with its look unchanged. Every other change is a variant, size or option
on a shared primitive whose only consumer is the wizard, so it ships in the PR
of its one adopter: there is no second place to convert.

## 16. Ticket split and order

All implementation tickets are `layer:platform-app`, one PR each, filed as
sub-issues of one epic (§2). Dependencies come from the files and shapes each
ticket touches (§15), never from numbering.

0. **#6314** (cross-set, drafted in this set's ticket file): this spec, the
   other reconciled specs and `2026-10-30-admin-redesign-resolutions.md` land on `main`. Nothing below
   is dispatched before it merges. #6404 (the glyphs, `ICONS.TICK`
   among them) and #6405 (their platform registration) are drafted in
   the voice set.
   0a. **#6305** (filed, `prio:next`, `cloud-ok`): a focused field stays visible above the pinned actions on a phone; the rail shows the account email from 768. Lands before 1a and 4. It is not a NEW-W2 ticket; the Full and Rail focus rule is #6327's.
1. #6321 tokens (§14), introduced with no reader. Needs 0. First in the
   admin token chain, so it lands before #6288.
   1a. #6322 the wizard onto `rail` (§14; needs #6305), and 1b. #6323 Choose a
   workspace onto `rail`. Each needs 1; they run beside each other and both
   land before #6288, which turns `side` grey.
2. #6325 field typography, hint placement and errors (§8). Needs 0, #6305, #6327 and
   #6337 (the `bad-line` #dd6152 border and `bad` error text the shared
   invalid state shows; both edit the control files).
3. #6326 phone header (§6). Needs 1 (`rounded-admin-bar`) and 1a (the
   `rail` tokens on `onboarding-rail/*` and `segmented-progress/*`).
4. #6327 shell (§4, §7, §11.1). Needs 1 (`text-admin-28`), 3 (both edit
   `onboarding-rail-variants.ts`) and #6305 (`onboarding-form-variants.ts`).
5. #6328 desktop rail (§5). Needs #6405 (`ICONS.TICK`), 3
   (`onboarding-rail/*`) and 4 (the rail width).
6. #6329 preset cards (§9.1–9.3). Needs 1a (`preset-picker-variants.ts`),
   #6405 (`ICONS.TICK`) and 2 (the wizard label size and hint leading).
7. #6330 accent row (§9.4). Needs 6 (`site-look-fields/*`) and #6339
   (it puts `hue-slider/` on the #6337 ring helper, which this ticket
   only restricts to keyboard focus). It introduces the shared `AccentSwatch`
   and moves Review's and the Colour card's swatches to it, so it blocks
   #6392 and #6386's swatch slot (both adopt it) and never runs
   beside #6394, the Look ticket that edits `colour-card/`.
8. #6331 Review step (§10). Needs 4 (Button `LG`, `onboarding-actions/*`),
   7 (`AccentSwatch`), #6337 (the link colour it reuses, `button/`) and
   #6356 (the detail-list metrics its variant builds on).
9. #6332 preview (§11). Needs #6426 (Look adopts the shared preview
   first, the user's order), 4 (the column, wrapper and Rail placement) and
   device-frame frame E drawn (§1).
10. #6333 Dark (§14.1). Needs #6291 (dark palette), 1a, 2, 3, 4, 5, 7, 8, 9, 10, #6390
    and `gap-onboarding-dark-steps` drawn (§1).
11. #6334 manual test (supersedes #6197), after #6305, 1, 1a, 1b, 3–10 and #6333 merge; it also
    checks the criteria of 1, 1a and 1b, which have no other check.

1 runs after 0 and 2 after #6337, in parallel; 1a and 1b run beside each
other; 9 can run beside 5–8 once #6426 is in.

**Never in parallel with other sets (same files; order free unless an edge
above fixes it):**
`SH/button/` — #6327, #6331, #6333, #6337, #6358, #6410;
`SH/form-field/`, `text-input/`, `option-select/` — #6325, #6333,
#6337, #6339, #6343, #6384, #6385; `SH/preset-picker/` —
#6322 (`preset-picker-variants.ts`), #6329, #6333, #6339, #6291,
#6425, #6395 (X20: the two Look tickets build in
`features/look/look-form/components/preset-card/` and take the Look page off
the shared picker);
`SH/accent-swatch/` and `colour-card/` — #6330, #6394 (then
#6392 and #6386 adopt the swatch); `SH/hue-slider/` — #6330,
#6333, #6339, #6393, #6291;
`SH/checkbox/` — #6331, #6333, #6339; `SH/detail-list/` — #6331,
#6333, #6356, #6359, #6409, #6383; `SH/step-indicator/` —
#6322, #6328, #6291; `LY/dashboard-tenant-picker/` — #6323,
#6340, #6291; `preview-frame/` — #6332,
#6390, #6406, #6426 (#6332 only adopts `device-frame/`); `LY/signed-in-account/` — #6322,
#6287, #6288, #6375; onboarding's site address — #6332 and #6351
(which goes last).

Related open tickets that touch the same files run after this set: #6209 (a
sample page per site type, preview) is blocked by #6332, and #5683 (the
currency field, fields) by #6325. The epic's `## Order` records both.

The feature page `docs/features/platform-sign-in-and-onboarding.md` is updated
by each PR that changes what it describes. When the manual-test issue closes, a
docs-only PR checks the feature page carries the final shape and deletes this
doc. No implementation PR deletes it, because the manual test reads §4 and §17.

## 17. Acceptance checklist

Tick each against the build at the frame's width, side by side with the board
frame named in the heading.

**F1 · 1440 · Step 1 Site** (`wizard-W2-side-rail-step1`; preview: `gap-onboarding-device-frame-preview` A)

- [ ] E1 three columns 300 / flex / 560, full height
- [ ] E2 rail `#0f1115`, border-right `#1c1f26`, padding 28/24
- [ ] E3–E5 brand row gap 10; mark 28×28 radius 6, "V" 15/700; "Valstack" 16/700, tracking .2px
- [ ] E6–E8 intro mt 44, gap 8; title 20/600, line-height 1.3, `p`; description 13px `#c9cfda`, line-height 1.55
- [ ] E9–E10 list mt 32, gap 4; the `ol` is named "Setup steps"; no `nav`
- [ ] E11 current row: `#20242e`, radius 6, ring 2px `#a5b4fc`, "1" 12/600, "Site" 14/600 white
- [ ] E12–E14 upcoming rows: ring 1.5px `#7d8696`, numbers 12/600, labels 14/500 `#7d8696`
- [ ] below the list only the account block, at the rail foot, or nothing (D-3, decided 31 Oct)
- [ ] E23 main white, padding 56/64/40, no card
- [ ] E24 "Step 1 of 4" 13/600 `#5b6472`; E25 h1 "Site" 28/600, tracking -0.2px, line-height 1.2, 6px gap
- [ ] E26 fields mt 32, gap 28
- [ ] E28–E33 Site type: label 13.5/600; control 40px, `control-line` border, radius 4, 14px; chevron 16px at right 12; options Blog, Portfolio, Personal / résumé, Docs, Blank; hint below, 12px, line-height 1.45
- [ ] E34–E37 Site name: label 13.5/600; input 40px 14px "Field Notes"; hint below; the two fields stacked
- [ ] E27 footer pinned, pt 20, pb 40, border-top `#eef0f3`, Continue right-aligned alone
- [ ] E38 Continue 40px, px 20, `#4f46e5`, 600 14px, radius 4, no shadow
- [ ] E66 preview column 560, `#f6f7f9`, padding 32/28
- [ ] P0 the preview section a column with a 12px gap, filling the column
- [ ] P1–P2 "Live preview" 15/650 with "1280 px wide · shown at 37%" in mono 12px on one baseline
- [ ] P3–P6 one toolbar row: Desktop pressed, Tablet, Phone · Light pressed, Dark · then the globe, 6px gap, and `your-site.[root-domain]` (D-20) in mono 12/500 at the right end; no Reader, Follow or Full screen
- [ ] P7–P8 stage `#eef0f3` padding 16 filling the column; desktop frame 470×294 with only its three dots in the bar
- [ ] P11–P12 the LX sample with "Field Notes", the three-layer mark, Posts, About, Topics, EN, the theme toggle; no Sign in, no Newsletter card
- [ ] P14 the sample in Blog's starter preset, Editorial (Fraunces, `#fbf7f0`, the three-layer mark in its tones); the buttons in the colour D-8 settles (recommended: the starter accent `#c2552e`); choosing Docs re-dresses it in Console
- [ ] P13, P15 the cookie-settings button (D-28) and the frame's scroll and scrollbar (D-29) as decided

**F2 · 1440 · Step 3 Look** (`wizard-W2-side-rail-step3`; preview: `gap-onboarding-device-frame-preview` B)

- [ ] E15, E16 done rows: tick SVG on `#a5b4fc`, label 14/500 `#c9cfda`, summaries 12px `#7d8696` ("Blog · Field Notes", "field-notes.[root-domain]")
- [ ] E17 current "3" Look; E18 upcoming "4" Review
- [ ] E24 "Step 3 of 4"; E25 "Look"
- [ ] E39–E40 group named "Look"; legend 13.5/600, cards 6px below it
- [ ] E41 two cards side by side, gap 14
- [ ] E42 Console unselected: border 1px `#e5e7eb` + 0.5px margin; mini 72px `#0f1115` with nav bars, "Build Log" mono 500 `#4f9cf0` 13px, tagline 10.5px `#c9cfda`, skeleton bars 80%/55%; footer "Console" 14/600, description 12.5px; empty radio ring 18px right
- [ ] E43 Editorial selected: border 1.5px `#4f46e5` + 3px `#eef2ff` ring; mini `#fbf7f0`, "Field Notes" Fraunces 600 `#2a2320`, tagline `#6f655b`; filled radio dot with white tick
- [ ] E44 hint below the cards: mt 4 plus the 6px group gap, 10px
- [ ] E45–E51 accent: label 13.5/600; row gap 14, 36px tall; track 12px pure rainbow (D-10); thumb 20px with the board's border and shadow at 4.4%; swatch 20×20 in the current accent (D-31) right of the slider
- [ ] E52–E53 footer: Back left (40px, px 18, `control-line` border, white, 600 14px), Continue right
- [ ] P2 with Tablet pressed: "820 px wide · shown at 56%"; tablet bezel 458×659; the sample header is the name plus Menu
- [ ] P6 the address reads `field-notes.[root-domain]`

**F3 · 1440 · Step 4 Review** (`wizard-W2-side-rail-step4`)

- [ ] E19–E21 done rows, including "Look · Editorial"; E22 current "4" Review
- [ ] E24 "Step 4 of 4"; E25 "Review"
- [ ] E54 rows min-height 52, border-bottom `#eef0f3`, first row border-top
- [ ] E55–E59 dt 120px 13px `#5b6472`; dd 14/500; values Blog, Field Notes, field-notes.[root-domain] (not mono), English, Editorial
- [ ] E60 swatch 16px radius 4 in the current accent, 8px after "Editorial", exposed as an image (name per D-7)
- [ ] Edit ×5: inside each `dd`, text links 13.5/600 `#4f46e5`, no border, right-aligned, 36px min, names "Edit Site type" … "Edit Look"
- [ ] E61–E63 checkbox 18px, gap 10, label 14px line-height 1.45 with two links
- [ ] E64–E65 Back + "Create site"
- [ ] the preview keeps the device and scheme chosen on step 3 (Tablet, Light) after Continue, and again after Back and an Edit from Review (P10)

**F4 · 390 · Step 3 Look (phone)** (`wizard-W2-side-rail-phone`; preview: `gap-onboarding-device-frame-preview` D)

- [ ] E88 order: header → main → preview → action bar
- [ ] E89 header `#0f1115`, padding 16/16/18, column, gap 14, no bottom border
- [ ] E90–E92 mark 26×26 radius 6, "V" 14/700; "Valstack" 16/700, tracking .2px
- [ ] E93–E94 "Step 3 of 4 · Look" 13/600 `#c9cfda`
- [ ] the progress is heard once (progressbar "Setup steps", value text "Step 3 of 4 · Look")
- [ ] E95–E99 stepper: 4 segments, gap 6, 4px tall, radius 2; Site and Address `#a5b4fc`, Look `#ffffff`, Review `#20242e`
- [ ] no intro text, no vertical list; the account block at the right end of the brand row, or nothing (D-3, decided 31 Oct)
- [ ] E100 main white, padding 24/16/28, no "Step N of 4" line
- [ ] E101 h1 "Look" 24/600, line-height 1.2
- [ ] E102 fields mt 20, gap 24
- [ ] E103–E106 two preset cards side by side, gap 10, same anatomy as desktop; hint below
- [ ] E107–E112 accent row with the rainbow track and swatch; row and slider 36px or 44px tall (D-26)
- [ ] E113 preview wrapper padding 20/12/24, border-top `#e5e7eb`, filling down to the bar
- [ ] P0 the preview section a column with a 10px gap
- [ ] P1–P2 "Live preview" (not "Preview") with the long readout "390 px wide · shown at 85%" in the 366px section
- [ ] P4–P5 toolbar buttons 44×44, Phone pressed; the address on its own line under the buttons; a long address ends in an ellipsis on that line (P6)
- [ ] P7–P9 stage padding 10; phone bezel 332×718; the sample header is the name plus Menu
- [ ] E128–E130 action bar after the preview: white, p 16, border-top `#e5e7eb`, gap 12; Back and Continue 44px, equal width, Back padding 0 18 with a `control-line` border on white, Continue padding 0 20 on `#4f46e5`, both 600 14px, radius 4

**F5 · every step at 390 (stepper and action bar)**

- [ ] step 1: Site `#ffffff`, Address, Look, Review `#20242e`; the bar shows Continue alone at full width
- [ ] step 2: Site `#a5b4fc`, Address `#ffffff`, Look and Review `#20242e`; the verdict chip on its own line above Back and Continue inside the bar
- [ ] step 3: as E96–E99
- [ ] step 4: Site, Address, Look `#a5b4fc`, Review `#ffffff`; Back and Create site equal width
- [ ] after Back and after an Edit from Review, the segments match the step shown
- [ ] Review at 390: the rows keep the 120px `dt`, Edit is at least 44×44

**F6 · Address step and field errors** (`gap-onboarding-field-error`)

- [ ] 1440 step 2 at rest: "Step 2 of 4", h1 "Address" 28/600; footer Back left, verdict chip between, Continue right
- [ ] E136–E138: "Site address" 13.5/600; input 40px 14px filling a row with the `.[root-domain]` suffix outside it (gap 8, 14px `#5b6472`, never shrinking); hint "Letters, numbers and hyphens. You can connect your own domain on the Growth plan." below; "Language" with the E31/E32 trigger and chevron, options English, Dutch, French, German, Spanish; hint "The language your site starts in. You can add more later." below
- [ ] E139–E142 rail: Site done "Blog · Field Notes", Address current "2", Look and Review upcoming
- [ ] 390 step 2: h1 24/600, input 16px 44px, fields mt 20
- [ ] A (E131–E133, E135): empty Site name after Continue — label, control with a `#dd6152` border and `aria-invalid`, hint, then "Enter a name for your site." 12/1.45/500 `#b42318` 6px below; hint announced before the error; the preview shows "Your site" and `your-site.[root-domain]`
- [ ] B (E134): taken address, per D-25 (decided 31 Oct) — either the error inline under the hint with the input invalid and no chip (as drawn), or the message in the verdict chip between Back and Continue (as noted); the input's description is the suffix, the hint, then the message

**F7 · Rail tier and wide screens** (`gap-onboarding-rail-tier`; preview: `gap-onboarding-device-frame-preview` C)

- [ ] 767: Phone tier. 768: Rail tier (rail 300 beside main)
- [ ] A 1024×768: main 724, padding 56/64, content 596; the preview 32px under the fields, as wide as the content, no grey wrapper; "1280 px wide · shown at 44%"; desktop frame 562×351; at main's scroll top the preview runs under the pinned footer (pt 20, pb 40, border-top `#eef0f3`)
- [ ] B 768×1024: content 340; the two cards 163px each, descriptions on two lines; desktop frame 308 wide at 24%; the whole step fits, so main does not scroll; the toolbar as device-frame frame E draws it (undrawn, §1)
- [ ] 1359: Rail tier. 1360: Full tier (three columns)
- [ ] 1600: the content column is capped at 640px, left-aligned; the select and footer do not stretch past it (D-22)
- [ ] Full and Rail with a short window (1440×700, 820×700): main scrolls inside itself; the rail does not scroll; the footer stays at the bottom on white with 40px below the buttons; fields pass under it unseen (D-4)

**F8 · Dark** (`gap-onboarding-dark`, with the preview toolbar per `gap-theme-token-dark-values`)

- [ ] 1440 step 3: the rail identical to Light; main `#171a20` with `#e8eaef` text and `#a3abb8` step label and hints; the preview column `#0f1115` with a 1px `#2b303a` rule against main; the pinned footer on `#171a20` with a `#232730` rule
- [ ] Back on `#171a20` with `#e8eaef` text; both preset cards on `#171a20`
- [ ] Back, inputs and the empty radio ring `#737d8d`; Continue `#5850ec` with white text
- [ ] selected Editorial card: 1.5px `#a5b4fc` border, 3px `#23244a` halo, dot `#a5b4fc` with a `#0f1115` tick; card and swatch borders `#2b303a`
- [ ] preset minis, the rainbow track and the sample site keep their colours; the preview stays on Light until Dark is pressed
- [ ] 390 step 3: the phone header as Light, plus the Dark bottom border if D-27 takes it; the preview wrapper `#0f1115` and the action bar `#171a20`, each with a 1px `#2b303a` top rule; toolbar buttons, Back and Continue 44px tall; the stage padding 10 with no border and "390 px wide · shown at 85%", as in Light
- [ ] the hue thumb with a 1px `#0f1115` border and a `0 1px 3px rgba(0,0,0,.6)` shadow at 1440 and 390
- [ ] steps 1, 2 and 4 and both field errors as `gap-onboarding-dark-steps` draws them (undrawn, §1)
- [ ] the toolbar track, pressed and idle buttons, stage and frame chrome take the `gap-theme-token-dark-values` dark values; the frame's scrollbar follows the preview's Light/Dark, not the admin theme

**Retired elements (not built)**

- E67–E75, E114–E121: W2's browser window, chrome bar, dots, address bar, scheme toggle, canvas and site card — replaced by P0–P10 (X21, D-9, D-24).
- E76–E87, E122–E127: W2's mock sample site (header, hero, three posts, thumbnail rows) — replaced by the LX sample, P11–P14 (D-11, D-12, D-19).

## Out of scope (optional follow-up)

Not filed. Each can be picked up later as its own ticket:

- **W2's mock sample site**: the hero type, three post columns and the 72×56
  phone thumbnail rows (E76–E87, E122–E127). The shared LX sample replaces it;
  the thumbnail rows would need a `ui` horizontal `MediaCard` and a platform
  adoption ticket.
- **Choose a workspace at the wizard's rail sizes** (D-15): the picker keeps its
  brand mark and intro sizes and is on no chosen board.
- **Hint below the control on every admin form** (X18): the wizard's FormField
  option stays wizard-only.
- **Deriving the preview address from the site name on step 1** (D-20, if the
  user keeps the recommended placeholder).
