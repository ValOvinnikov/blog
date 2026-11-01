---
name: platform-ui-practices
description:
  Use when building or changing any UI in apps/platform, the operator/tenant
  admin app — a page, card, form field, settings form, table, notice, dialog,
  empty or loading state, phone layout, or any text size, colour, spacing,
  radius or visible copy there.
---

# Platform UI practices (`apps/platform`)

What an admin page, card, field and state look like, with the decided values.
It sits on top of `react-component-practices` (§ Props, § Where a component
lives, § Styling files, § Size and splitting, DOM ids from `useId`) and
`.claude/agents/platform-app.md` (Base UI, one component per file, the ghost
clauses, i18n plumbing) and repeats neither. Code paths below are under
`apps/platform/src/`.

Where this skill and `docs/design-reference/admin-panel-mock.html` disagree on
a value, this skill wins; the mock still sets layout intent. Never invent a
token or primitive this skill doesn't name, and never patch a primitive's gap
at one call site: fix it in the primitive, for every caller.

**Start from a recipe.** Copy the one that fits whole, rename it, and keep every
class and prop it shows; the sections after the recipes give the rules.

## Recipes

### A page with a card

```tsx
<div className={root()}>
  <PageHeader title={t('pageTitle')} description={t('description')} />
  <Card>
    <Card.Header
      title={t('visitsTitle')}
      supportingText={t('visitsDescription')}
      actions={<RefreshButton />}
    />
    <Card.Body>
      <Text>{t('visitsSummary', { count })}</Text>
    </Card.Body>
  </Card>
</div>
```

- `root` is `flex flex-col gap-6`. `Text`'s default body variant (13.5px
  `admin-text`) is for primary content and values: a sentence, a count, a
  name. `variant="muted"` (12.5px) is only for a description or a secondary line,
  `supporting` only for `PageHeader`'s description: never pick either to get a
  size.
- The card's purpose is `supportingText`, never a paragraph opening `Card.Body`.
  `RefreshButton` is a `'use client'` leaf: a secondary `size={SIZE.SM}`
  `Button` with `isPending` + `pendingLabel`.

### Settings fields

Text fields, in a card under `SettingsFormShell` (`fields` is
`flex flex-col gap-4`); `isArchived` and `archivedDescribedBy` come from
`useSettingsFormState()`:

```tsx
<div className={fields()}>
  <FormField
    label={t('mastodonLabel')}
    hint={t('mastodonHint')}
    error={mastodonError && t(`fieldError.${mastodonError}`)}
    control={{ id: mastodonId, describedBy: archivedDescribedBy }}
  >
    <TextInput
      type="url"
      value={values.mastodonUrl}
      onChange={(mastodonUrl) => onFieldChange({ mastodonUrl })}
      isReadOnly={isArchived}
    />
  </FormField>
</div>
```

- **A field with a format rule (a URL, a handle, a length) has its error path,
  all four parts:** the Server Action validates it and returns
  `{ outcome: ACTION_OUTCOME.INVALID, fieldErrors }`, a `{ reason }` code per
  field; the component keeps the codes in state; it passes the translated
  `error`, which marks the field invalid;
  and `useSettingsForm` gets
  `invalidControls: () => ({ ids: mastodonError ? [mastodonId] : [] })`.
- Compose `FormField` around `TextInput`, as here: `FormTextInput` has no
  `isReadOnly` or `control` and is at seven props, so compose rather than add
  one. `FormField` gives its `TextInput` or `Textarea` the id, label, hint,
  error, invalid and disabled state; `control.describedBy` adds an outside
  description, such as the archived notice.

Binary settings, one `SettingRow` per switch, all in one `Card.Body`, in a card
under the shell; `isPending`, `isArchived` and `archivedDescribedBy` again come
from `useSettingsFormState()`:

```tsx
<SettingRow
  label={label}
  description={description}
  isLocked={lockReason !== undefined}
  lockedReason={lockReason}
>
  <Switch
    isChecked={values[field]}
    onCheckedChange={(checked) => handleToggle(field, checked)}
    isDisabled={lockReason !== undefined || isPending || isArchived}
    ariaLabel={label}
    labels={{ on: t('switchOn'), off: t('switchOff') }}
    aria-describedby={archivedDescribedBy}
  />
</SettingRow>
```

- `lockReason` is `undefined` or the translated reason the switch can't be
  used, set for every cause other than saving or archiving (not on the plan, the
  plan's limit reached, another setting off), each with its own key: no row is
  blocked without one.

### A table

```tsx
<DataTableShell
  items={tenants}
  ariaLabel={tView('title')}
  emptyMessage={t('empty')}
  columns={[
    { key: 'tenant', label: t('columnTenant') },
    { key: 'created', label: t('columnCreated') },
    {
      key: 'actions',
      label: <span className={visuallyHidden()}>{t('columnActions')}</span>,
    },
  ]}
  renderRow={(tenant) => (
    <DataTableShell.Row key={tenant.id}>
      <DataTableShell.Cell>
        {tenant.name}
        <span className={secondary()}>{tenant.primaryDomain}</span>
      </DataTableShell.Cell>
      <DataTableShell.Cell>
        <time dateTime={tenant.createdAt.toISOString()}>
          {formatDate(tenant.createdAt, locale)}
        </time>
      </DataTableShell.Cell>
      <DataTableShell.Cell>
        <LinkButton href={manageHref} variant="secondary" size={SIZE.SM}>
          {t('manage')}
        </LinkButton>
      </DataTableShell.Cell>
    </DataTableShell.Row>
  )}
/>
```

- `DataTableShell` owns the card, scroll region, header, row, cell and empty
  classes (11px uppercase muted heads, 14px cell padding, row hover, a centred
  empty line); never restyle them. Your component's own `tv()` adds content
  slots only: `visuallyHidden` is `sr-only`, `secondary` is
  `block text-admin-12 text-admin-muted`.
- A translated label on every column (`sr-only` for actions), `<time dateTime>`
  for dates, `emptyMessage` for the empty list. `ariaLabel`, the page's title,
  names the scroll region. A mode the shell lacks (a card title) goes into the
  shell, kept in the empty state, never a hand-built `<table>`.

### Editing a shared primitive

- Change only what your task needs. A gap you do fix is fixed in full, every
  class its rule names, never the colour without the size.
- A control you build gets `border-admin-control-line`, `Button`'s focus ring
  and the type table's sizes. A primitive at its prop ceiling: restructure it
  first or compose its parts (→ `react-component-practices` § Props).
- Drift elsewhere in a file you touch: CLAUDE.md → "Examine before you change".

## Page anatomy

- Every gated page renders inside `AdminShell`, whose `ShellFrame` owns the
  content column (`max-w-[1180px] p-4 md:p-[26px]` on `bg-admin-bg`). A page
  adds no outer padding, max-width or background; its root is
  `flex flex-col gap-6` (header, notices, then card rows).
- `PageHeader` is the page's only title block: `title` (the one `h1`),
  `description`, `badges` (`StatusBadge`s) and `actions`, once per page.
  Settings pages get it from `SettingsFormShell`, whose `description` is
  required. The main action goes in `actions`: a primary `LinkButton` for an
  in-app route, `ExternalLinkButton` for an off-app one.
- `PageHeader` sits directly on the page background — no band, rule or
  padding of its own. The title block takes the free width and `actions` sit
  top-right, wrapping under it, left-aligned, once less than 320px would be
  left for the title. Status and controls sit in `actions`. The page root's `gap-6` sets header-to-content at 24px; don't
  add margin, padding or a background around it per page.
- Width: a single-column settings page keeps `SettingsFormShell`'s `max-w-3xl`;
  one with a preview, or list + editor + preview, passes `isWide`; every other
  page fills the shell.
- Columns collapse to one below `lg` (`grid-cols-1 lg:grid-cols-2` with
  `items-start`), never at `md`. A preview column is
  `lg:sticky lg:top-admin-topbar lg:self-start` (the token clears the sticky
  topbar). Email puts its item picker in the page header (`SettingsFormShell`
  `headerActions`) and, like Look, splits editor and preview 50/50 from `lg`.
- A grid inside a column sizes from that column: `@container` on the card body
  and `@sm:grid-cols-2` on the grid.
- Pre-shell pages share the onboarding wizard's dark rail: `RailBrand` and
  `RailIntro` at the top and `SignedInAccount` at the foot, beside a light
  pane. The workspace picker's rail is a 300px column from `lg` that never
  scrolls, and a top band plus a sticky bottom account bar below it; its
  `RailIntro` is the page's only `<h1>`. Choices are visible light-surface
  link rows in one `Card`, none pre-selected. Dead-end pages (404, error,
  sign-in error) use `DeadEndView` on `CenteredCardFrame`.
- The Studio route is full-bleed in every state, and is the only route that
  is: neither `ShellFrame` nor `StudioMountView` adds padding around the
  mounted Studio or its archived and not-provisioned states.

## Cards

- Every content group in a page body is a `Card`. `Card.Footer` is only for a
  form's submit actions, right-aligned (an `ml-auto` group, as
  `TenantDetailsPanel`'s `footerActions`).
- `Card.Header` renders an `h2` by default; a section nested under a card
  section passes `headingLevel={3}`.
- `Card.Header` `actions` hold card-scoped status and small controls only: a
  `StatusBadge`, a 12px muted count, an `sm` `Button`, a `SegmentedControl`.
- Padding comes from the parts (header `px-[18px] py-3.5`, body `p-[18px]`);
  don't re-pad `Card.Body`.
- A failure card (a failed run, a danger zone) is a `Card` with an
  `admin-bad`-tinted border and title, as `DeprovisionTenantControl`'s is.
- On an editing page with columns, the list, the editor and the preview are each
  their own `Card`. Voice is the exception: each surface's preview sits inside
  its surface card.
- Details inside a card's list row open from a compact toggle sized to the row,
  never a card-chrome `Disclosure` nested in the card.

## Type

**Font:** Inter at a 14px base, set once on `<body>` in
`app/[locale]/layout.tsx` (`font-admin text-admin-14`). `Heading` and the
editor's `h2` set `font-admin` and `tracking-normal` themselves, because the
site's base layer gives `h1`–`h4` its display font and `-0.02em` tracking.
Nothing else names a family: no `font-sans`, `font-ui` or inline `fontFamily`
on admin chrome. Font specimens (`FontPicker`, `PresetPicker`) are exempt,
like the colour section's artwork. No `tracking-*` beyond the table's and the
sidebar's own (`sidebar-variants.ts`: brand name `tracking-[0.2px]`, section
labels `tracking-[0.09em]`). `font-mono` is for domains, ids and DNS values
(`DetailList.Row isMono`).

| Role                                                         | Write                                                   | Renders                                                                                                      |
| ------------------------------------------------------------ | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Page title                                                   | `PageHeader` `title`                                    | 24px, 600, `tracking-[-0.01em]`                                                                              |
| Page description                                             | `PageHeader` `description`                              | 13.5px muted (`Text variant="supporting"`, kept for page descriptions only)                                  |
| Card title                                                   | `Card.Header` `title`                                   | 15px, 650 (`Heading size="cardTitle"`)                                                                       |
| Dialog title                                                 | `AlertDialog.Title` at `cardTitle`                      | 15px, 650                                                                                                    |
| Card description                                             | `Card.Header` `supportingText`                          | 12.5px muted                                                                                                 |
| Description or prose inside a card                           | `Text variant="muted"`                                  | 12.5px muted, never larger than the label above it                                                           |
| Small title inside a card (step, notice, list item, summary) | the primitive's title slot                              | 13.5px, 600                                                                                                  |
| Field label                                                  | `FormField` `label`                                     | 13px, 600, field labels only                                                                                 |
| Field hint                                                   | `FormField` `hint`, a plain string                      | 12px muted, under the label, above the control                                                               |
| Lock reason                                                  | `SettingRow` `lockedReason`                             | 12px muted, the hint style                                                                                   |
| Field error                                                  | `FormField` `error`                                     | 11.5px `admin-bad`, inline under the field                                                                   |
| Body: primary content and values                             | `Text`                                                  | 13.5px `admin-text`                                                                                          |
| Read-only facts                                              | `DetailList` (`isMono` for domains, ids)                | 13.5px values, 12.5px muted terms, mono 12.5px                                                               |
| Control text                                                 | `TextInput`, `Textarea`; `Button`                       | 13.5px (16px below `md`); 13px at `md`, 12px at `sm`                                                         |
| Table header; table cell                                     | `DataTableShell`                                        | 11px, 700, uppercase, `tracking-[.06em]`, muted (not `faint`); 13.5px `admin-text`, a second line 12px muted |
| Badge                                                        | `StatusBadge`                                           | 11.5px, 600                                                                                                  |
| Caption, meta (a header count, a step time, a caption)       | `Text variant="meta"`                                   | 12px muted                                                                                                   |
| Empty state                                                  | one sentence in `Card.Body`; `emptyMessage` for a table | 13.5px muted; centred in a table                                                                             |
| Save status                                                  | `SettingsFormShell` only                                | 12px `admin-ok`                                                                                              |

- Sizes are the `--text-admin-*` tokens in `styles/admin-theme.css`, one per
  pixel value: `text-admin-11`, `text-admin-11-5`, `text-admin-12`,
  `text-admin-12-5`, `text-admin-13`, `text-admin-13-5`, `text-admin-14`,
  `text-admin-15`, `text-admin-16`, `text-admin-20`, `text-admin-24`. A new one is registered in
  `FONT_SIZE_TOKENS` in `utils/tv/tv.ts`, or tailwind-merge drops it as a
  colour. No arbitrary `text-[Npx]` and no size off the scale; the site's named
  sizes (`text-xs`, `text-sm`, `text-base`, `text-label`, `text-meta`, …)
  never appear outside `site-preview/`. The font, preset and upload pickers'
  specimen labels are artwork and exempt.
- A site preview renders inside `SiteThemeFrame`, which applies the tenant's
  fonts through `--font-display-family` and `--font-body-family`; never set
  `--font-display`, `--font-read` or an inline `fontFamily`.

## Colour and contrast

- Colours come only from the `admin-*` tokens in `styles/admin-theme.css`: no
  hex, no raw palette colour, no site token outside `site-preview/`.
  `BrandMark`'s gradient and the preset swatches are artwork and exempt.
- `text-admin-text` for content, labels and values. `text-admin-muted` for
  descriptions, hints, terms, table headers, meta and timestamps. Semantic
  colours (`ok`, `warn`, `bad`, `brand`) only for state. `text-admin-faint`
  (3.1:1 on surface) only for decorative separators, placeholder glyphs and
  disabled text. `StatusBadge`'s `plan` tone is for plan tiers only.
- Readable text is at least 4.5:1 against its surface (`admin-muted` is 5.98:1
  on surface, 5.58:1 on bg). Control boundaries, selection markers and focus
  indicators are at least 3:1 against what they sit on.
- Every control boundary is `border-admin-control-line` (3.48:1): text fields,
  the editor, selects, radio circles, the switch's off track, the segmented
  track, menu triggers. `border-admin-line` (1.24:1) is decorative structure
  only: card borders, dividers, the dashed upload box.
- A selected item shows a 3:1 marker (`border-admin-brand`, a bar), not a
  `bg-admin-brand-weak` fill alone, and announces itself as pressed, checked or
  selected.
- Focus is `Button`'s ring (`focus-visible:ring-2`,
  `focus-visible:ring-admin-brand`, `focus-visible:ring-offset-2`, with
  `outline-hidden`); on the dark sidebar `ring-admin-side-accent` with
  `ring-offset-admin-side`. A text field turns its border `admin-brand`.
  `outline-admin-brand-weak` (1.12:1) is not a focus indicator.

## Spacing, radius, elevation

| Between                                                   | Value                                           |
| --------------------------------------------------------- | ----------------------------------------------- |
| Header, notices and card rows; cards in a column; columns | `gap-6` (24px)                                  |
| Fields in a card                                          | `gap-4` (16px)                                  |
| Label, hint, control and error of one field               | `FormField`'s own `gap-[5px]`                   |
| Buttons or badges in a row                                | `gap-2`                                         |
| Collapsed rows of one list                                | none: one list divided by `border-admin-line-2` |

No other value between those things: no `gap-5`, `gap-[18px]`, `mb-[18px]`, or
`mb-3.5` between sections.

- Radius: two tokens. `rounded-admin` (6px) for surfaces: cards, dialogs,
  popovers, menus, toasts, notices, the save bar. `rounded-admin-control` (4px)
  for everything interactive or small: buttons, inputs, selects, pickers,
  segmented tracks and thumbs, list rows, chips, image thumbnails, code blocks. `rounded-full`
  only for pills and circles. Never a site radius (`rounded-md`, `-lg`, `-xl`)
  or an arbitrary `rounded-[Npx]`.
- Elevation: `shadow-admin` on resting surfaces and controls, `shadow-admin-lg`
  on floating layers only (save bar, dialog, toast, popup). A notice nested in a
  card has no shadow.

## Forms and settings

- A page that edits persisted tenant settings goes through `useSettingsForm`
  and `SettingsFormShell`: save bar, unsaved count, Cmd/Ctrl+S, the leave
  guard, draft recovery and the header's "All changes saved". No per-card Save,
  no page-level saved indicator. Success fires `toast.success`.
- Cards under the shell read `isArchived`, `isPending` and
  `archivedDescribedBy` from `useSettingsFormState()`; never pass them to every
  card by hand.
- Every text field is `FormTextInput`, or `FormField` around a control (the
  settings-fields recipe). `hint` is a plain string, never a sized `<span>` or a
  `<Text>`. A field's error is `FormField`'s inline `error`, never an `Alert` in
  the field; `invalidControls.ids` names the focusable controls, in page order,
  one entry per invalid field. When the first one can be hidden (another
  language, a collapsed row), `invalidControls.revealFirst` shows it before the
  save bar's link focuses it. A failure that belongs to no field is one
  `Alert` (ERROR) under the header.
- An embedded edit panel outside the shell (today only the tenant details panel)
  calls `useUnsavedChangesGuard`, submits from a right-aligned `Card.Footer`,
  and shows its save error above the card.
- `SettingRow` describes a Base UI control in its slot by its description and
  lock reason, through `Field`. `FormField` links its hint and error to the
  control itself; never wire them per call site (no `` `${id}-error` `` strings,
  no id'd span in `hint`, no ids threaded past `SettingRow`).
- Use the existing controls (`Switch`, `SegmentedControl` for a small
  either/or, `TextInput`, `Textarea`, `PortableTextEditor`, `AssetUploadField`,
  `PresetPicker`, `FontPicker`, `HueSlider`). A mode one of them lacks belongs
  in it (raise it if your ticket doesn't cover it), never in a copy beside it.
- Archived tenant: `ArchivedTenantNotice` under the header. Every editing
  control takes its read-only look (`isReadOnly`), not `isDisabled`'s faint
  text; one with no read-only mode, such as `Switch`, takes `isDisabled`. Its
  `aria-describedby` includes the notice's id, joined with its hint and error
  ids, never replaced by them.
- Per-field status on Look, Voice and Email (unsaved dot, Default/Customised
  badge, Reset) sits in the field header, through `FieldStatus`
  (`FormField`'s `actions` slot) or, for a card title, `UnsavedDot`; Reset is
  hidden when read-only.
- Buttons: one primary per surface; `md` by default; `sm` in `Card.Header`
  actions, a field's Reset and toolbars. A pending button uses `isPending` +
  `pendingLabel`. A destructive action goes through `ConfirmDialog`.

## Reusable blocks

- Before writing a component, look in `components/shared/` and the domain's
  `components/features/<domain>/`. When a block fits, use it; a mode it lacks
  goes into the block, never into a copy beside it. A pattern a second consumer
  needs becomes a block in that change, placed per
  `react-component-practices` § Where a component lives.
- A block is built on the Base UI part that owns the behaviour (`Field`,
  `Select`, `Collapsible`, `Tabs`, `Toolbar`, `Dialog`, `Switch`, …), styled
  from admin tokens in its `tv()` (→ `react-component-practices` § Styling
  files). It owns keyboard, focus and ARIA; callers pass content through
  compound slots (`Card.Header`) or a small closed prop set, a hook or a
  context, never a long prop list.
- A feature component stays thin: it composes blocks and wires data. One that
  styles a raw Base UI part another page also uses is a block not yet extracted.

## Props

- The ceiling (seven props here), what counts, and the drop → group → slot →
  hook → context ladder: `react-component-practices` § Props.
- Context placement: app- or shell-wide in `src/context/<name>-provider/`
  (`toast-provider`, `unsaved-changes-provider`, `settings-form-provider`); one
  domain's in `src/components/features/<domain>/<name>-provider/`
  (`sidebar-collapse-provider`, `look-form-provider`). The provider and its
  `use<Name>()` hook share one file, exported through the folder's barrel.
- Components in `src/components/shared/` stay prop-driven and read no app
  context: they take plain props (`isDisabled`, `aria-describedby`, `value`)
  and feature components fill them. The exceptions are a compound component's
  own internal context, Base UI's contexts, and the unsaved-changes guard,
  which `GuardedLink` and `SettingsFormShell` read from
  `@platform/context/unsaved-changes-provider` by design.
- Base UI parts own their ids, ARIA wiring and disabled, open and selected
  state; `Field` wires the ids (`.claude/agents/platform-app.md` → "Base UI is
  the behaviour layer"). Compose its part, or the block built on it; never add
  an `id`, `isInvalid` or `isOpen` prop that re-implements it.
- Also exempt from the closed-props contract (`react-component-practices`
  § Props → Contract): a component used as a Base UI `render` target, such as
  the app's `Link`. It must accept and forward the ref and the props Base UI
  merges in. Check this before passing any closed-props component as `render`,
  and never close such a contract during a props cleanup.
- Testing a component that reads `useSettingsFormState()`:
  `testing-practices` → "Rendering and arrangement".

## Data loading

apps/platform runs the Next 16.3 App Router on React 19.2 with `cacheComponents`
turned off, so `'use cache'`, `cacheLife` and PPR are not available here. The
tools you have are `loading.tsx`, `<Suspense>`, `cache`, `use`,
`useTransition`/`startTransition`, `useOptimistic`, Server Actions
(`'use server'`), `useLinkStatus` from `next/link` and `router.refresh()`.

- **First paint loads only what first paint shows.** Data that appears only
  inside a closed `Disclosure`, `Menu` or `Dialog`, a collapsed settings
  section, or an inactive tab loads when that UI opens.
  - A tab that is a view of its own is its own route segment with its own
    `loading.tsx`. Never build one page that loads every tab.
  - Hidden client-side content calls a Server Action on the first
    `onOpenChange(true)` and keeps the result in local state, so reopening
    doesn't fetch again. Show the shared `Spinner` while the action is pending.
  - The Server Action re-runs the gate for its tree
    (`requireTenantMembership(tenantId)` on `/dashboard`, `requireTenantById`
    under `/tenants/{id}`) and scopes every read by tenant id, because its
    arguments come from the client.
  - Data the request already loaded for another purpose is projected, not
    fetched again on open.
- **Visible but slow data streams in.** Wrap the slow part (one card or one
  badge) in `<Suspense fallback={…}>` around an async Server Component that
  awaits it, as low as the slow part goes, so the rest of the page — and
  `PageHeader` — renders first.
  - Here a `*PageContent` component, or a Suspense-wrapped async section under
    `src/components/features/`, may load its own data through `@blog/db` or
    `src/server/`. Never a `'use client'` component or a `shared/` primitive.
  - To stream into a client component, pass it the server-rendered element as a
    `ReactNode` slot.
- **Every wait shows something.**
  - Each dynamic segment under a shell layout has a `loading.tsx` that renders
    `PageSkeleton` (`components/features/layout/page-skeleton/`). That file is
    also what lets `Link` prefetch a dynamic route.
  - A Suspense fallback for a card, table or list is a `Skeleton`
    (`components/shared/skeleton/`) shaped like the content it stands in for,
    with the same size and the same number of rows.
  - Small or inline waits use the shared `Spinner` with a `label`: a button, the
    body of a disclosure or menu, or a control whose page is re-fetching. A link
    that navigates without a `loading.tsx` shows its pending state with
    `useLinkStatus`.
  - A `router.push` that only changes search params never shows `loading.tsx`
    again. Run it in `startTransition`, update the control immediately with
    `useOptimistic`, and show the `Spinner` while `isPending`.
  - Never leave a region blank, and never let a control freeze without a signal.
- **No waterfalls.** Start independent awaits together in one `Promise.all`.
  - A gate may run first. Work keyed only by route params starts alongside the
    gate, with bad input guarded so the gate's redirect still wins.
  - When one lookup only feeds another query (memberships, then tenants),
    replace both with one join in `@blog/db`.
- **One read per request.** Anything that more than one layout, page or
  component reads during a request goes through a `cache()`-wrapped function:
  `getSession`, `requireAdmin`, `requireTenantById`, `resolveDashboardTenant`,
  `listSessionTenants`.
  - A page under a gated layout takes the tenant from the layout's cached
    resolver.
  - Never query again for a row you already have. Derive from it, for example
    `queries.tenants.selectLiveLocales(tenant)`.
  - Next does not dedupe a `fetch` that passes `signal`, which includes every
    call using `AbortSignal.timeout`. Make one external request serve everything
    a page needs from it.
- **Select only what renders.** A list query never pulls a jsonb blob that is
  shown only on demand. When a consumer uses only part of a query, narrow or
  replace that query; don't add a near-duplicate beside it.
- **Send client components only the fields they render.** Map a `@blog/db` row
  to a client-safe shape on the server before it reaches a `'use client'`
  component. A `Pick<>` type removes nothing at runtime. Never send token
  ciphertext or any other secret. Never pass a plain function, only a Server
  Action, so compute hrefs on the server.
- **Poll only while the result is on screen.** Gate the polling hook on the
  condition that renders its view (`isEnabled`); stop at a terminal state, cap
  the ticks, and pause while `document.visibilityState === 'hidden'`. Delete a
  poll whose result nothing renders; after a mutation, call `router.refresh()`
  instead of leaving a poll running.

## Notices and states

- One notice primitive renders page notices and form results: `Alert` with an
  optional `action` and `role`. Never hand-build a tone box or add another
  notice style.
- A notice's title is a short phrase; the explanation is its description, at
  regular weight. Weight marks a title, never a sentence.
- An empty state never removes the card or the header. A card whose data doesn't
  exist yet says so in one body sentence, never a header alone.
- A status line states only what happened: no "Checked just now" for a check
  that failed or never ran.
- `app/[locale]/not-found.tsx` and `error.tsx` render `DeadEndView` on the
  pre-shell `Card` layout. Don't add per-page fallbacks.

## Phones (below `md`)

- Text fields are at least 16px (`text-admin-16 md:text-admin-13-5`) so iOS
  doesn't zoom, and touch targets at least 44px (`min-h-11 md:min-h-0`). Both
  live in the primitives; add no call-site overrides to a shared primitive. A
  control you build yourself carries both.
- A page with an editor beside a preview gives phones Edit/Preview tabs below
  `lg` and renders only the active pane: the shared `ViewTabs` with
  `useViewTabs()` (Base UI Tabs), used by Look and Email, whose panels take
  `role="tabpanel"` below `lg` only. A page whose tabbed layout follows its
  content width instead passes `useViewTabs({ isTabbed })`, and the tabs and
  roles follow that. Voice keeps its per-card preview toggle.
- A dialog keeps a 16px gutter (`w-[calc(100%-2rem)] max-w-md`), which
  `AlertDialogShell` owns for `ConfirmDialog` and `LeavePageDialog`.
- Tables scroll sideways inside their card, and fact lists stack the term above
  the value below `md`. `DataTableShell` and `DetailList` own both; never
  add them per page.
- A Desktop/Mobile preview toggle is offered only where it changes what renders;
  an email's Desktop preview is a real 600px frame.
- Check in a browser at the manual-test matrix's 390, 820 and 1280px
  (CLAUDE.md → "Issue body template"), plus 1024px where `lg` columns start,
  with the sidebar open and collapsed, in more than one locale.

## Headings and landmarks

- One `h1` per page (`PageHeader`). Card titles are `h2`; a section inside one
  is `h3`. Nothing skipped, and what sits under a section heading nests below
  it.
- A site preview's root (`SiteThemeFrame`) is `inert`: its links and buttons
  take no focus and its headings stay out of the admin outline.
- A landmark matches its content: no `<nav>` around a list with no links, no
  `<aside>` around main content.

## Copy

The catalogue rules (no literal in JSX, five locales, Server Actions return
codes) are in `.claude/agents/platform-app.md` → "Copy and navigation". On top
of them:

- **A form branches on `outcome` and maps codes to catalogue keys.** Every
  mutating action returns one shape, a `TActionResult`; which outcome each
  failure answers is the table in `platform-app.md` → "Server-action results".
  The form maps each reason code to its catalogue key with a
  `satisfies Record<…>` map, so a new code fails `type-check` until it has
  copy:

  ```tsx
  const UPLOAD_REFUSAL_KEYS = {
    [UPLOAD_REFUSAL.FILE_TOO_LARGE]: 'fileTooLarge',
    // …one entry per UPLOAD_REFUSAL value
  } satisfies Record<TUploadRefusal, string>;

  const t = useTranslations('uploadErrors');
  const result = await uploadBrandAssetAction(tenantId, kind, formData);
  switch (result.outcome) {
    case ACTION_OUTCOME.SUCCESS:
      return setUrl(result.url);
    case ACTION_OUTCOME.REFUSED:
      return setError(t(UPLOAD_REFUSAL_KEYS[result.reason], result.values));
    case ACTION_OUTCOME.SERVER_ERROR:
      return setError(t('uploadFailed', { kind }));
  }
  ```

- Placeholders and `sr-only` text are catalogue keys too. No literal in JSX,
  including `'(opens in new tab)'`, `'https://…'` and `'°'`.
- Never assemble a sentence in code: no `' — '` joins, no concatenation, no
  `toLowerCase()` or `toUpperCase()` on a translated string. One ICU message
  with arguments, a key per case, ICU plurals for counts, and the locale's date
  and list formatting.
- Icons are not copy: "Add tenant" renders `ICONS.PLUS` in the button, not
  `'+ '` in the string. Show names, not codes: the language name, not `EN`; the
  translated role, not `SUPERADMIN`.
- A settings page's success toast reads "{Page} saved." Copy on the owner tree
  (`/dashboard`) never mentions tenants, tables, packages, CSS variables, colour
  spaces or vendors.
- Owner pages say "your site" or nothing; "tenant" is operator-only. A string
  a shared component renders on both trees follows the owner rule ("this
  site"), since `/tenants/...` reads fine either way.

## Red flags — stop

| You are about to write…                                                                                          | Write instead                                                                                                                     |
| ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `variant="muted"` / `"supporting"` to size a card's main content or value                                        | Plain `<Text>` (its body variant)                                                                                                 |
| `<Text variant="hint">`                                                                                          | `FormField` `hint` for a field; `variant="meta"` for a caption or meta                                                            |
| `text-sm`, `text-xs`, `text-base`, `text-label`, `text-meta`, or an arbitrary `text-[13.5px]`                    | The role's token, e.g. `text-admin-13-5`                                                                                          |
| Table classes of your own: 18px cell padding, no row hover, a left-aligned empty line                            | `DataTableShell` with its `Row` and `Cell` parts, unrestyled                                                                      |
| A `div` with `rounded-admin border p-[18px] shadow-admin`                                                        | `<Card>` with `Card.Header` and `Card.Body`                                                                                       |
| A paragraph opening `Card.Body` that says what the card is for                                                   | `Card.Header` `supportingText`                                                                                                    |
| A hand-built tinted box with a glyph                                                                             | `Alert`; a failure card is a `Card` with a bad header                                                                             |
| A second `h1`, or `<Heading level={1}>` in a page body                                                           | `PageHeader` `title`, once per page                                                                                               |
| `<h2>`, `<h3>` or a `font-semibold` span as a section title                                                      | `Card.Header` `title`                                                                                                             |
| `hint={<span className="text-admin-11-5 …">…</span>}`                                                            | `hint={t('…')}`                                                                                                                   |
| A field with a format rule and no `error` or `invalidControls.ids` entry, or an entry naming a wrapper           | The settings-fields recipe's error path, all four parts, with the focusable control's own id                                      |
| ``aria-describedby={`${id}-error`}`` beside `FormField`, or ids threaded past `SettingRow`                       | Nothing at the call site; `Field` links them                                                                                      |
| `<Alert>` inside a field for its validation error                                                                | `FormField` `error`                                                                                                               |
| A switch blocked by the plan or a limit with no `lockedReason`                                                   | `isLocked` + a reason for every lock (settings-fields recipe)                                                                     |
| Half a fix in a primitive (the colour but not the size)                                                          | Fix every class its rule names, or leave it for its own change                                                                    |
| `border-admin-line` on a text field, select, track or radio                                                      | `border-admin-control-line`                                                                                                       |
| `text-admin-faint` on text someone has to read                                                                   | `text-admin-muted`                                                                                                                |
| `text-indigo-800`, a hex, any raw palette colour                                                                 | An `admin-*` token                                                                                                                |
| `outline-admin-brand-weak` as the only focus cue                                                                 | `Button`'s `focus-visible:ring-2` ring with offset                                                                                |
| `gap-[18px]` or `gap-5` between cards, `gap-5` or `mb-[18px]` between fields                                     | `gap-6` between cards, `gap-4` on the fields' parent                                                                              |
| `rounded-[10px]`, `rounded-[5px]`, `rounded-lg`, `rounded-xl`                                                    | `rounded-admin` or `rounded-admin-control`                                                                                        |
| `font-sans`, `font-ui` or an inline `fontFamily` on admin chrome                                                 | Nothing; the font is set once on `<body>`                                                                                         |
| `sm:grid-cols-2` inside a half-width column                                                                      | `@container` on the body, `@sm:grid-cols-2` on the grid                                                                           |
| `@base-ui/react/switch` imported outside `shared/switch/`                                                        | The shared `Switch`; raise a missing mode                                                                                         |
| `{isPending ? t('saving') : t('save')}` as button children                                                       | `isPending` + `pendingLabel`                                                                                                      |
| The page's main action in the body, a non-form action in `Card.Footer`, a default-size `Button` in `Card.Header` | `PageHeader` `actions`; a card-scoped one as `size={SIZE.SM}` in `Card.Header` `actions`                                          |
| An English literal in JSX, an `aria-label` or a placeholder                                                      | A key in all five catalogues                                                                                                      |
| `label.toLowerCase()`, `` `${a} — ${b}` ``, `` `${hue}°` ``                                                      | One ICU message with arguments                                                                                                    |
| `min-h-11` or `text-admin-16` at a shared primitive's call site                                                  | Nothing; the primitive owns phone sizing                                                                                          |
| More code in a file over its size budget                                                                         | Extract the part you change first (`react-component-practices` § Size and splitting)                                              |
| A feature component styling a Base UI part another page also uses                                                | A block at the level its consumers share (`react-component-practices` § Where a component lives), used from both                  |
| A new prop on a component at seven (`FormField`, `FormTextInput`)                                                | Restructure first (`react-component-practices` § Props), or compose its parts, as `FormField` around `TextInput`                  |
| A prop every caller fills the same way, derives one-to-one from another prop, or that only a test passes         | The ladder's "Drop" step (`react-component-practices` § Props)                                                                    |
| Copying `useState` for open/value/error, `useTransition` and reset-on-close into another caller                  | The ladder's "Hook" step (`react-component-practices` § Props)                                                                    |
| Three booleans or handlers that configure one footer button or trigger                                           | The ladder's "Slot" step (`react-component-practices` § Props)                                                                    |
| `isArchived` + `archivedNoticeId` passed to every card under `SettingsFormShell`                                 | `useSettingsFormState()` in each card                                                                                             |
| `const a = await x(); const b = await y();` where `y` doesn't use `a`                                            | `const [a, b] = await Promise.all([x(), y()])`                                                                                    |
| `auth()` called directly, or a tenant query repeated in a layout or page                                         | The `cache()`-wrapped resolver: `getSession`, `requireAdmin`, `requireTenantById`, `resolveDashboardTenant`, `listSessionTenants` |
| `queries.tenants.getX(tenant.id)` when `tenant` is already in hand                                               | Derive it from the row, e.g. `queries.tenants.selectLiveLocales(tenant)`                                                          |
| Awaiting a slow external call (the Vercel API) in a page's top-level `Promise.all`                               | An async section inside `<Suspense>`, fallback `Skeleton`                                                                         |
| Loading data that only a closed Disclosure, Menu or inactive tab shows                                           | A Server Action called on first open with a `Spinner`, or a route segment per tab                                                 |
| `tenant={row}` or `hrefFor={() => …}` passed to a `'use client'` component                                       | A server-side projection of only the fields it renders, with hrefs computed on the server                                         |
| A `setInterval` poll inside a hook that runs on every render path                                                | Gate it on the condition that renders its view, stop at a terminal state, cap ticks, and pause while the tab is hidden            |
| A dynamic route with no `loading.tsx`, or a `router.push` with no pending state                                  | A `loading.tsx` page skeleton; `startTransition` plus a `Spinner`                                                                 |
