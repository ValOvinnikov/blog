---
title: Platform sign-in and onboarding
status: built
layers: [platform, auth, db, email, config, worker]
code:
  - apps/platform/src/app/api/auth/**
  - apps/platform/src/app/*/sign-in-error/**
  - apps/platform/src/app/*/sign-in/**
  - apps/platform/src/app/*/signup/**
  - apps/platform/src/components/features/layout/centered-card-frame/**
  - apps/platform/src/app/*/onboarding/**
  - apps/platform/src/components/features/onboarding/**
  - apps/platform/src/server/onboarding/**
  - apps/platform/src/constants/onboarding.ts
  - apps/platform/src/server/auth/set-signup-terms-cookie*
  - apps/platform/src/utils/legal-page-urls/**
  - apps/platform/src/instrumentation-client.ts
  - apps/platform/src/components/features/sign-in/**
  - apps/platform/src/server/auth/send-sign-in-link-action*
  - apps/platform/src/server/auth/sign-in-with-provider-action*
  - apps/platform/src/utils/safe-callback-path/**
  - apps/platform/src/utils/sign-in-error/**
  - apps/platform/src/components/features/layout/sign-out-button/**
  - apps/platform/src/components/features/layout/signed-in-account/**
  - apps/platform/src/server/auth/get-session-email*
  - apps/platform/src/server/auth/auth.ts
  - apps/platform/src/server/auth/require-session-user-id.ts
  - apps/platform/src/server/auth/resolve-home-href*
  - apps/platform/src/server/auth/sign-out-action*
  - apps/platform/src/app/*/page.tsx
  - apps/platform/src/proxy.ts
  - apps/platform/src/utils/requested-path/**
  - apps/platform/src/server/create-site-gate/**
  - apps/platform/src/server/rate-limit/**
epics: [4840, 4960, 4979, 4982, 4958, 4949, 5649]
---

# Platform sign-in and onboarding

## What it does

How a person gets into `apps/platform` and, once signed in, into a workspace.
Every platform user, operator, owner or invited editor, signs in on one
branded `/sign-in` page, and a prospect signs up on `/signup`, which offers
the same sign-in methods and records the terms they agree to. A
signed-in user with no workspace lands on `/onboarding`, which creates their
site as a 14-day Growth trial, with no card.

## Surfaces and routes

- `/sign-in` is Auth.js's `pages.signIn`, public, in the same frame as the
  dead-end pages (`CenteredCardFrame`: the Shinefold full logo alone, 36px
  tall, centred above a white card). Inside the card: the title and description, any
  sign-in error, a button per configured OAuth provider, an "or" divider and
  an email field that sends a magic link and says to check your inbox on the same page,
  or, when the send limit refused it, that too many links were requested and
  to try again in an hour.
  `adminRoutes.signIn(callbackUrl)` builds it, always with an explicit
  `callbackUrl` (`/` by default). A session gate passes the page the visitor
  asked for, which `src/proxy.ts` records in the `x-admin-requested-path`
  request header; a sign-in therefore lands on that page, by email link,
  GitHub or Google alike. `toSafeCallbackPath` keeps only a same-origin path,
  so a crafted `callbackUrl` falls back to `/`. Auth.js's own
  `/api/auth/signin` redirects here.
- Auth.js sends a sign-in failure back to `/sign-in?error=…`.
  `OAuthAccountNotLinked` (the email already signs in with another provider)
  gets its own message; any other error a general one.
- `/` redirects by `resolveHomeHref`: an admin to `/tenants`, a member to
  `/dashboard`, a user with no membership to `/onboarding`, a signed-out
  visitor to sign-in.
- A signed-in user opening `/sign-in` is sent on to its `callbackUrl`.
- Providers come from `@blog/auth`: GitHub and Google when their credentials
  are set, and the email magic link always. `SignInOptions` lists Google
  first on both `/sign-in` and `/signup`: an owner who signs up with Google
  (or GitHub) accepts the Sanity editor invite with the same account in one
  click.
- `/sign-in-error`: Auth.js's `pages.error`, public and in the panel's own
  styling. A `Verification` error (a magic link already used or expired) says
  so and links to sign-in for a new link; any other error gets a plain message
  and a link back to sign-in.
- `/signup`: the same card, titled "Create an account", with the same
  provider buttons and email field (`SignInOptions` with `isSignUp`), then the
  note "By continuing, you agree to the Terms of Service and the Privacy
  Policy", linked at `https://<TENANT_ROOT_DOMAIN>/terms` and `/privacy`
  (`routes.terms()` and `routes.privacy()` in `@blog/config`; the marketing
  site serves them), or named as plain text without a root domain. No
  checkbox and no separate step: choosing a provider or sending a link runs
  `setSignupTermsCookie` first, which checks Vercel BotID at its free Basic
  level and sets the `SIGNUP_TERMS_COOKIE_NAME` cookie to `TERMS_VERSION` for
  two days. A bot, or a failed check, gets no cookie and still signs in; a
  failed check is logged. A sign-up always lands on `/`. A signed-in visitor
  is sent to `/`. Under the card, `/signup` links to `/sign-in` ("Already have
  an account?") and `/sign-in` links to `/signup` ("New here?").
- Sign-out (account menu, or the button on pre-shell pages) runs
  `signOutAction` and returns to the sign-in page, whose next sign-in lands on
  `/`.
- Every signed-in pre-shell page shows a `SignedInAccount` line — "Signed in
  as <email>" and Sign out, the email read by `getSessionEmail`: the
  onboarding rail (below the step list on wide screens; on phones a compact
  Sign out beside the brand, without the email), the dashboard tenant
  picker, and the not-found page when a session exists.
  `/sign-in`, `/signup` and `/sign-in-error` never show it, and neither does
  the client-side error page, which has no session to read.

- `/onboarding`: a four-step setup wizard for a signed-in user with no
  membership and no `admins` row (`requireOnboardingUser`; anyone else is sent
  to their own home, so an invited member never sees it). A dark left rail
  (the `admin-rail*` tokens) carries the Shinefold full logo in its dark-ground colours, "Create your
  site" and the step list (an `ol` named "Setup steps", no `nav`), where a
  done step shows a tick and its choice ("Blog · Field Notes", the site
  address, the preset) and is announced as "Site, Complete, Blog · Field
  Notes", and the current step carries `aria-current="step"`. The rail draws
  its intro at the wizard size, and below 768px the S box in place of the
  full logo, through an `isWizard` prop on `RailBrand` / `RailIntro`; Choose
  a workspace shows the full logo at every width. The current
  step's fields sit
  beside it with Back / Continue, and the live site preview follows every
  step. The preview is the Look page's shared device frame (`PreviewFrame`
  and `DeviceFrame`): a "Live preview" heading with its size readout ("1280
  px wide · shown at 37%", always the long forms, a polite status), then one
  toolbar ("Preview options") holding the Device group (Desktop, Tablet,
  Phone) and the Colour scheme group (Light, Dark), and no reader switch,
  follow or full screen. The toolbar ends with the chosen address behind a
  globe — announced as "Site address" then
  `<slug>.<TENANT_ROOT_DOMAIN>`, following the slug as it is typed
  (`your-site.<TENANT_ROOT_DOMAIN>` before then) and cut with an ellipsis
  when too long — on the toolbar row when the section is wide enough and on
  its own line otherwise. The frame (an image named "Sample page at {width}
  px") draws the desktop bar's three dots without a host, and lays Look's
  sample (`LookSample`) out at the device width, scaled to the stage's width
  (less its border, bezel and bar) and, in the Full tier, its inner height
  too (no 608px cap), so the whole frame stays inside the stage. The sample
  wears the typed name ("Your site" while empty) with no logo, the chosen
  preset's header, footer and busy styles and the accent, the language
  switcher, no reader accounts, and the cookie-settings link or button only
  where the preset's Look and feature defaults would show them. Full and
  Rail open on Desktop and Phone on Phone, all on Light; the wizard holds
  the pressed device and scheme above the tier-placed preview, so Continue,
  Back, an Edit from Review and a resize across a tier edge keep them. The
  step's content sits directly on a white column, not in a card,
  capped at 640px and left-aligned. The layout has three tiers, read in JS
  with `useMediaQuery` at the same edges the CSS uses, so the preview renders
  once, in its tier's place, and the DOM order is the keyboard order:
  - **Full** (from 1360px): the 300px rail, the content column and a 560px
    grey preview column side by side. The page never scrolls; the content
    column scrolls inside itself above Back / Continue, pinned to its foot.
  - **Rail** (768–1359px): the 300px rail and the content column, with the
    preview inside the column below the fields and above the same pinned
    Back / Continue.
  - **Phone** (below 768px): the rail is a dark top band: the brand row (with
    Sign out at its right end), then "Step N of 4 · <step>" over a segmented
    progress bar (the shared `SegmentedProgress`, on Base UI `Progress`).
    Then the fields, the preview on grey, and Back / Continue as a bar at the
    end of the page, in flow; the page scrolls as one column.

  The pinned actions sit below the scrolling area, never over it, so a
  focused field can always be scrolled clear of them. The server renders the
  Phone order; from 768px the phone preview stays hidden until the tier is
  read, so neither wider tier flashes it. Assistive tech hears the phone
  progress bar once, as one progressbar named "Setup steps" whose value text
  is the visible line; the line and the segments themselves are hidden from
  it. From 768px up the step header reads "Step N of 4" above the heading
  instead. The wizard follows the platform's Light / Dark theme through
  the platform tokens, while the rail and the phone header stay dark in both. In
  Dark the Full preview column is ruled off from the content column, the
  phone header gains a 1px bottom border and the hue thumb takes a dark
  border and deeper shadow; Light draws none of these, and the preview's own
  Light / Dark stays independent of the platform theme. Each step's fields stack at every width. A wizard field puts its
  hint directly below the control and any error below the hint (13.5px
  labels, 14px controls from 768px, 6px between label, control, hint and
  error), and the control is described by the hint, then the error, through
  the `FIELD_APPEARANCE.WIZARD` option on `FormField` (`control.appearance`),
  `OptionSelect` and `FormSiteAddressInput`; every other platform form keeps the
  hint above its control. The steps:
  1. **Site** — the site type (Blog, Portfolio, Personal / résumé, Docs or
     Blank) and the site name.
  2. **Address** — the Site address (only the subdomain, with
     `.<TENANT_ROOT_DOMAIN>` shown beside it, checked live by
     `checkSiteAddressAction` as the user types) and the starting language,
     each with its hint below it. A taken, reserved or invalid address shows
     its error under the hint, with the input invalid and described by the
     suffix, the hint, then the error; the actions' `role="status"` region
     repeats it as screen-reader-only text so it is announced as it appears.
     The other verdicts — checking,
     "<address> is yours" and the orange (`warn`) "couldn't check" note — are a tinted
     chip in a `role="status"` region in the pinned actions, between Back and
     Continue (on its own line above the buttons in the phone action bar).
  3. **Look** — the preset and accent colour. Each site type starts on its
     own preset and that preset's accent (`STARTER_PRESET_BY_SITE_TYPE`:
     Editorial for Blog, Portfolio and Personal / résumé; Console for Docs and
     Blank), and changing the site type moves the preview with it until the
     owner picks a preset or moves the accent here; from then on their choice
     stays whatever the site type.
  4. **Review** — every choice in a ruled row (`DetailList` with
     `isBordered`), each with an Edit back to its step: a button styled as a
     text link (`BUTTON_VARIANT.LINK`), since it changes the step rather than
     navigating. Below the rows, the terms acceptance again in the 18px
     checkbox (`SIZE.LG`) (a magic link opened in another browser carries no
     `/signup` cookie), then one sentence saying an email will come from
     Sanity, the editor, to accept with the account used to sign up.

  Continue checks only the current step: the name must not be blank, and the
  address must be filled in and not known to be taken, reserved or invalid.
  On the Address step Continue is disabled while the check runs and on an
  error; an address whose check failed is let through, since Create site
  checks it again. Back keeps every value, and Continue after an
  Edit from Review returns straight to Review. Nothing is saved until **Create site** on Review runs
  `createSiteAction` once with every value; a field error it returns (an
  address taken meanwhile) opens that field's step, and a refusal or server
  error shows as one error `Alert` in the footer, above Back and Create site,
  with every value kept. Success redirects to
  `/dashboard`, whose site setup card follows provisioning.

- **Trial on `/dashboard`.** While the site is in TRIAL with a
  `trial_ends_at`, the owner's Overview shows an info note under the header
  (`TrialNotice`, `role="note"`; the page derives it with `trialFor`): the
  plan, the end date in a `<time>` element, that no card is needed, and that
  the site then moves to Free. Once the end date has passed, and until the
  daily sweep moves the site to Free, it says the trial ended on that date
  and the site moves to Free shortly (`ownerHomePage.trialEnded*`). It has no
  Upgrade action until the Checkout page exists; every member sees the
  Overview, so that action will need an owner gate.

- **First run on `/dashboard`.** Once provisioning is READY, the owner's
  Overview shows a "Get started" card after the site setup card and before
  "Your site" (`getStartedFor`, `GetStartedCard`). It is for the tenant's
  real OWNER only — never another member, an operator viewing the tenant or
  an archived tenant — and is gone once all four steps are done; it has no
  dismiss. Its header counts "N of 4 done" (the steps only). The body leads
  with "Your site is live": the main address in mono, Copy address (the
  shared `CopyButton`, icon-only at every width with its accessible name) and
  a primary Open site, which drop under the text on a phone with Open site
  full width. The steps describe the site's state, not who acted: an
  operator saving Look or Voice ticks them too. Then an ordered checklist, each row
  announced as done or not done, a done row showing its title only:
  - **Pick a look** — done once `site_config.look_saved_at` is set, which the
    Look save stamps (the wizard's preset does not count); links to Look.
  - **Set your voice** — done once `site_config.voice_saved_at` is set,
    stamped by the Voice save; links to Voice.
  - **Accept your editor invite** — done once
    `tenants.owner_invite_accepted_at` is set, or when the owner was never
    invited (the Studio opens unconditionally). Until then it shows the
    owner-access pill (Invite sent, Setting up…, Needs attention) with the
    Studio page's Check now and Resend invite (`OwnerAccessActions`).
  - **Write your first post** — done once `tenants.first_post_published_at`
    is set, which `apps/web`'s revalidate webhook stamps for the first
    published non-starter post. Greyed with no link until the owner's Studio
    access is READY — "opens once your editor invite is accepted" before
    then, or "once your editor access is set up" between acceptance and
    READY — then links to the Studio.

  The Look and Voice saves stamp after revalidating, best-effort
  (`stampSavedAt`): a failed stamp is logged as
  `site_config.saved_at_stamp_failed` and never fails the save.

## Data

- The Auth.js tables in Neon (`users`, `accounts`, `sessions`,
  `verification_tokens`) with the `database` session strategy. On sign-in,
  pending `membership_invites` for the exact email, found through its keyed
  index, become `memberships`.
- `@blog/db`'s `createSelfServeTenant`
  writes a GROWTH tenant in status TRIAL (`trial_ends_at` `TRIAL_LENGTH_DAYS`,
  14, after `created_at`; no Stripe customer or subscription; provisioning
  PENDING, `site_type`),
  the OWNER membership, the `tenant_domains` row for `<slug>.<domain>`,
  `site_config` with the chosen preset and accent hue, `settings_features`
  and a `CREATED` / `TENANT` audit event with the owner as actor. `neon-http`
  has no transactions, so a failed dependent write deletes the tenant row and
  its FK cascades sweep the rest. It refuses an invalid domain or address, a
  taken domain (`DB_DUPLICATE_DOMAIN`, including a concurrent submit of the
  same slug) and a person who already holds a Free or trial site
  (`DB_ALREADY_OWNS_FREE_TENANT`).
- Create site (`createSiteAction`), in order: validate; check the address
  (`checkTenantSlug`) and `ownsFreeTenant` for the session's email, so a
  refusal there spends no gate slot; `admitCreateSite`, refused with the same
  neutral "try again later" as `/signup`; record the terms acceptance
  (`recordTermsAcceptance`, a no-op once recorded); `createSelfServeTenant`,
  mapping `DB_DUPLICATE_DOMAIN` to a taken address and
  `DB_ALREADY_OWNS_FREE_TENANT` to the one-site refusal; then
  `startProvisioning` and `/dashboard`, even when the enqueue failed, since
  the dashboard shows the run's state: a site still PENDING with every step
  idle gets a "setup hasn't started" notice with **Start setup**.
- One Free or trial site per person, at a time: Free and trial share one
  slot, and a self-served site holds it for as long as it keeps its
  `self_serve_owner_email_index`. The trial belongs to the site, not the
  account, so archiving a site frees the slot for a new trial; a per-account
  limit is added only if that is abused. `ownsFreeTenant(email)` is the
  pre-check. It strips the `+tag` (`normalizeEmailIdentity`) and matches a
  non-archived tenant whose `self_serve_owner_email_index` is that address's
  index, whatever its plan or status — exactly what the database guard below
  compares, so the two never disagree for a self-served site — or a
  non-archived FREE tenant which an OWNER membership ties to the account at
  the stripped address (operator-created Free sites). Accepted gap: an
  operator-created Free site owned by `name+1@…` does not block `name+2@…`.
  An archived tenant frees the slot; suspended and failed ones keep it, a
  suspended trial included, and an unaccepted OWNER invite doesn't count. The
  database enforces it too: `createSelfServeTenant` stores the `+tag`-free
  hash in `tenants.self_serve_owner_email_index`, under a partial unique index
  over keyed, non-archived rows, so two simultaneous submits can't both
  succeed. Operator-created tenants leave it null. Only a paid, running
  site gives the key up, in the same statement that makes it one: a move to a
  paid plan with status ACTIVE or PAST_DUE (`planChangeFields`, used by
  `updateTenantDetails` and `setTenantPlan`), or a paid site that is not an
  unpaid trial resuming to ACTIVE from a lift, a wake or a reactivation
  (`resumedTenantFields`). A trial or a suspended site keeps it. So the rule
  is checked only when a site is created: a site that was once paid can drop
  back to FREE beside its owner's other Free or trial site, and an owner who
  once paid can hold two. Reactivating an archived Free or unpaid-trial site
  (`reactivateTenant`, `DB_ALREADY_OWNS_FREE_TENANT`) is refused while its
  owner holds another; an archived paid site reactivates without its key, so
  it is never refused. The rule binds self-serve sites only, and operators
  may override it: Add tenant (`createTenantAction`) never checks it, and an
  operator may move an operator-created site to FREE however many Free sites
  its owner holds.
- A new user's first platform sign-in records `users.termsAcceptedAt`
  and `termsVersion` when the request carries the `SIGNUP_TERMS_COOKIE_NAME`
  cookie with the current `TERMS_VERSION` (both in `@blog/config`). Existing
  users are never stamped, and a recorded acceptance is never overwritten.
  Signing up from `/signup` sets that cookie; Create site records the
  acceptance it asks for again.

## Configuration

- Operator access is decided by an `admins` row after sign-in, never by a
  separate sign-in. The first admin is granted by hand with
  `pnpm --filter @blog/db db:seed-admin`.
- Self-serve starts every site as a Growth trial, one Free or trial site per
  user at a time. Wizard,
  card and email copy is fixed platform copy, not [Voice](./voice.md).
- `takeCreateSiteSlot(clientKey)` allows
  at most `MAX_SITES_PER_IP_PER_DAY` (3) creates per IP and
  `MAX_SELF_SERVE_SITES_PER_DAY` (50) in total per UTC day, counted in Upstash
  Redis. The first refusal past the total cap emails every super admin once
  that day. `admitCreateSite({ clientKey, email })` wraps it: an email that
  `isSignupBlocked` matches is refused first and takes no slot, and a failed
  lookup refuses too. Create site calls `admitCreateSite` before writing
  anything and answers every refusal with the same neutral "try again later"
  message, so the blocklist can't be probed.
- `@blog/db`'s `normalizeSignupEmail` lower-cases an address and drops any
  `+tag`, so `name+1@…` and `name+2@…` resolve to one person. The
  one-site-per-user lookup compares addresses in that form.

## Constraints and invariants

- The platform is not indexed: `[locale]/layout.tsx` sets
  `robots: { index: false, follow: false }`, so every page under it, public or
  session-gated, serves `noindex, nofollow`. There is no `robots.txt`, because
  a crawler must fetch a page to read its noindex.
- `@blog/auth`'s `findMagicLinkSendRefusal` refuses a magic-link send to
  an address or domain on `@blog/db`'s signup blocklist (`isSignupBlocked`),
  then past the per-IP and per-address hourly limits. The per-address count
  keys on `normalizeEmailIdentity`, so `+tag` variants share one budget. A
  refusal sends nothing. A block or a failed check never throws, so it shows
  the same check-your-inbox page as a real send and a block is never
  confirmed to the person blocked. A send over either limit throws
  `MagicLinkSendLimitedError`, a `CredentialsSignin` whose `code` is
  `MAGIC_LINK_SIGN_IN_CODE.SEND_LIMITED`; `sendSignInLinkAction` answers it
  with `RATE_LIMITED`, which the form shows as the try-again message. It
  names no account, so it reveals nothing about whether one exists. Every
  request, refused or sent, takes at least `MAGIC_LINK_RESPONSE_FLOOR_MS`.
- Each refusal reaches the app through `buildAuthConfig`'s
  `onSendRefused` handler, which logs one `auth.sign_in_link_refused`
  warn line with its `MAGIC_LINK_REFUSAL` reason. A failed check adds only
  the error's name and its Postgres `cause.code`, never a message or detail,
  which can embed a counter key or the address. The line never carries the
  email, the IP or a hash of either.
- `resolveHomeHref` picks a dead end's link and `/`'s redirect by role:
  operators to `/tenants`, members to `/dashboard`, no membership to
  `/onboarding`. `/dashboard` with no membership redirects to `/onboarding`.
- The Sanity project is created by the provisioning run Create site starts,
  never at signup.
- The platform builds Auth.js with `AUTH_APP.PLATFORM`: its cookies carry
  their own names, each session it creates is stamped `PLATFORM` in
  `sessions.app`, and a session stamped otherwise reads as signed out. Invite
  side effects run only here: the invite-consuming and terms-recording
  sign-in events and the invite email template.
- The platform's sign-in and invite emails render in the platform layout
  (the stacked logo mark and "Platform" in the top band). A site's sign-in
  email keeps its tenant's layout, or the neutral one on an unknown host.

## Dependencies

- `@blog/auth`, `@blog/db`, `@blog/email` (magic-link and invite mail).
- Features: [reader-auth](./reader-auth.md),
  [tenant-access](./tenant-access.md),
  [tenant-provisioning](./tenant-provisioning.md),
  [platform-shell](./platform-shell.md),
  [plans-and-entitlements](./plans-and-entitlements.md),
  [public-front-door](./public-front-door.md).
- Vercel BotID (`botid`: `withBotId` in `next.config.ts`, `initBotId` in
  `src/instrumentation-client.ts` protecting POSTs to `/signup`; `src/proxy.ts`
  skips its challenge path). No env var of its own. It runs at the free Basic
  level; Deep Analysis is a paid option billed per check, to reconsider at
  public launch.
- Env: `AUTH_SECRET`, `AUTH_GITHUB_ID`/`AUTH_GITHUB_SECRET`,
  `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET`, `RESEND_PLATFORM_API_KEY`,
  `MAGIC_LINK_FROM_ADDRESS`, `KV_REST_API_URL`/`KV_REST_API_TOKEN` (the
  Create site gate's counts), `OPERATOR_ALERT_FROM_ADDRESS`.

## Entry points

- `apps/platform/src/server/auth/auth.ts` (the platform's `NextAuth()` call)
- `apps/platform/src/server/auth/require-session-user-id.ts`
- `apps/platform/src/server/auth/resolve-home-href.ts`
- `apps/platform/src/app/[locale]/sign-in/page.tsx`
- `apps/platform/src/app/[locale]/signup/page.tsx`
- `apps/platform/src/server/auth/set-signup-terms-cookie.ts`
- `apps/platform/src/app/[locale]/onboarding/page.tsx`
- `apps/platform/src/server/onboarding/create-site-action.ts`
- `apps/platform/src/server/onboarding/check-site-address-action.ts`
- `apps/platform/src/app/[locale]/sign-in-error/page.tsx`
- `packages/auth/src/config.ts`
- `packages/auth/src/events/record-signup-terms-on-sign-in.ts`
- `apps/platform/src/server/create-site-gate/create-site-gate.ts`
- `packages/db/src/queries/tenants/create-self-serve-tenant/create-self-serve-tenant.ts`
- `packages/db/src/queries/tenants/owns-free-tenant/owns-free-tenant.ts`

## Tests and stories

- `apps/platform/src/server/auth/resolve-home-href.test.ts`,
  `sign-out-action.test.ts`, `send-sign-in-link-action.test.ts`,
  `sign-in-with-provider-action.test.ts`, `sign-in/page.test.tsx`,
  `sign-in-error/page.test.tsx`, `signup/page.test.tsx`,
  `set-signup-terms-cookie.test.ts`, `legal-page-urls.test.ts`,
  `create-site-action.test.ts`, `check-site-address-action.test.ts`,
  `require-onboarding-user.test.ts`, the `onboarding-view*.test.tsx` files,
  `safe-callback-path.test.ts`, and the view tests beside `sign-up-view`,
  `sign-in-view`, `email-sign-in-form`, `centered-card-frame`, `sign-out-button`,
  `signed-in-account` and `dead-end-view`, plus `get-session-email.test.ts`.
- `create-site-gate.test.ts`, `alert-self-serve-limit.test.ts` and the
  `server/rate-limit/` store tests.
- No Storybook in `apps/platform`.

## Related

- #4840 epic: platform front door (Order 6b is the design of record).
- #4960 shared `/sign-in`, `/signup`, `/onboarding` and self-serve tenant
  creation.
- #4979 epic: web and platform stay separate; #4982 the platform keeps its own
  sign-in and refuses sessions it did not issue.
- #4958 magic-link send limits and terms acceptance on first sign-in.
- #4949 reserved subdomains and a slug availability check.
- #5648 the Create site gate: per-IP and total daily limits, `+tag` addresses.
- #5649 epic: the signup blocklist; #5651 the magic-link send refuses it.
