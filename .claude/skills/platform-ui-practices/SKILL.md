---
name: platform-ui-practices
description:
  Use when building or changing any UI in apps/platform, the operator/tenant
  admin app — a page, card, form field, settings form, table, notice, dialog,
  empty or loading state, phone layout, or any text size, colour, spacing,
  radius or visible copy there.
---

# Platform UI practices (`apps/platform`)

What an admin page, card, field and state look like, with the decided values. It
sits on top of `react-component-practices` (closed props, DOM ids from `useId`)
and `.claude/agents/platform-app.md` (Base UI parts, the shared primitives,
`*-variants.ts` with `tv`, one component per file, the ghost clauses, i18n
plumbing) and repeats neither. Comments follow CLAUDE.md → "Comments default to
zero".

The values here are decided. Where this skill and
`docs/design-reference/admin-panel-mock.html` disagree on a value, this skill
wins; the mock still sets layout intent.

Some decided primitives and tokens have not landed. Each is marked **Not yet:**
with what to write until it does. Never invent the missing token or primitive,
and never patch its gap at one call site: the change that lands it fixes every
caller at once. Code paths below are under `apps/platform/src/`.

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
      headingLevel={2}
      actions={<RefreshButton />}
    />
    <Card.Body>
      <Text className={summary()}>{t('visitsSummary', { count })}</Text>
    </Card.Body>
  </Card>
</div>
```

- Variants: `root` is `flex flex-col gap-6`; `summary` is
  `text-[13.5px] text-admin-text`, the slot for primary content and values (a
  sentence, a count, a name). **Not yet:** `Text`'s body variant has no size,
  so `Text` without it renders at 16px. `variant="muted"` (12.5px) is only for
  a description or a secondary line, `supporting` only for a page description
  (`PageHeader`'s, or the line under a pre-shell page's `h1`): never pick either
  to get a size.
- The card's purpose is `supportingText`, never a paragraph opening `Card.Body`.
  `RefreshButton` is a `'use client'` leaf: a secondary `size={SIZE.SM}`
  `Button` with `isPending` + `pendingLabel`.

### Settings fields

Text fields, in a card as above inside `SettingsFormShell` (`fields` is
`flex flex-col gap-4`):

```tsx
<div className={fields()}>
  <FormField
    label={t('mastodonLabel')}
    htmlFor={mastodonId}
    hint={t('mastodonHint')}
    error={mastodonError && t(`fieldError.${mastodonError}`)}
  >
    <TextInput
      id={mastodonId}
      type="url"
      value={values.mastodonUrl}
      onChange={(mastodonUrl) => onFieldChange({ mastodonUrl })}
      isInvalid={Boolean(mastodonError)}
      isReadOnly={isArchived}
      aria-describedby={isArchived ? archivedNoticeId : undefined}
    />
  </FormField>
</div>
```

- **A field with a format rule (a URL, a handle, a length) has its error path,
  all four parts:** the Server Action validates it and returns
  `{ ok: false, fieldErrors }`, a code per field; the component keeps the codes
  in state; it passes the translated `error` and `isInvalid`; and the page
  passes `invalidFieldIds={mastodonError ? [mastodonId] : []}` to the shell.
- Compose `FormField` around `TextInput`, as here: `FormTextInput` has no
  `isReadOnly` and is past seven props, so it takes no new one.

Binary settings, one `SettingRow` per switch, all in one `Card.Body`:

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
    onLabel={t('switchOn')}
    offLabel={t('switchOff')}
    aria-describedby={isArchived ? archivedNoticeId : undefined}
  />
</SettingRow>
```

- `lockReason` is `undefined` or the translated reason the switch can't be
  used, set for every cause other than saving or archiving (not on the plan, the
  plan's limit reached, another setting off), each with its own key: no row is
  blocked without one.

### A table

Copy this variants file, adding only content slots (a name, a badge):

```ts
export const auditLogTableVariants = tv({
  slots: {
    card: ['overflow-hidden'],
    table: ['w-full border-collapse text-left'],
    head: [
      'border-b border-admin-line-2 px-[14px] py-2.5',
      'text-[11px] font-bold uppercase tracking-[.06em] text-admin-muted',
    ],
    row: [
      'border-b border-admin-line-2 last:border-b-0 hover:bg-admin-surface-2',
    ],
    cell: ['px-[14px] py-3 align-middle text-[13.5px] text-admin-text'],
    secondary: ['block text-[12px] text-admin-muted'],
    empty: ['p-8 text-center text-[13.5px] text-admin-muted'],
  },
});
```

- This is `tenants-table-variants.ts` without the drift it and
  `findings-table-variants.ts` still carry (`text-sm`): copy this, not them. Cells pad 14px, not the card's 18px.
- Render through `DataTableShell`: `classNames` from `card`, `table`, `head`
  and `empty`; `row()` and `cell()` in `renderRow`; a translated label on every
  column (`sr-only` for actions); `<time dateTime>` for dates; `emptyMessage`
  for the empty list, in the same card. A card title is a mode the shell lacks:
  it goes into the shell, kept in the empty state, never a hand-built `<table>`.

### Editing a shared primitive

- Change only what your task needs. Its other **Not yet:** gaps stay for the
  change that fixes them; name them in your report. A gap you do fix is fixed in
  full, every class its rule names, never the colour without the size.
- New code never copies a primitive's not-yet classes: a control you build gets
  `border-admin-control-line`, `Button`'s focus ring and the type table's sizes.
  A primitive at seven props takes no new prop; compose its parts instead.
- In a file you edit, lines your task changes follow this skill in full; drift
  on other lines stays and goes in your report.

## Page anatomy

- Every gated page renders inside `AdminShell`, whose `ShellFrame` owns the
  content column (`max-w-[1180px] p-4 md:p-[26px]` on `bg-admin-bg`). A page
  adds no outer padding, max-width or background; its root is
  `flex flex-col gap-6` (header, notices, then card rows).
- `PageHeader` is the page's only title block: `title` (the one `h1`),
  `description`, `badges` (`StatusBadge`s) and `actions`, once per page.
  Settings pages get it from `SettingsFormShell`, whose `description` is
  required. The main action goes in `actions`: a primary `LinkButton` for an
  in-app route, `ExternalLinkButton hasArrow` for an off-app one.
- **Not yet:** `PageHeader` adds its own `mb-5`, so header-to-content is 44px.
  Keep the parent's `gap-6`; don't add or remove margin around it per page.
- Width: a single-column settings page keeps `SettingsFormShell`'s `max-w-3xl`;
  one with a preview, or list + editor + preview, passes `isWide`; every other
  page fills the shell.
- Columns collapse to one below `lg` (`grid-cols-1 lg:grid-cols-2` with
  `items-start`), never at `md`. A preview column is
  `lg:sticky lg:top-[68px] lg:self-start` (68px clears the sticky topbar). From
  `xl`, Email folds its list into the item picker and splits editor and preview
  50/50, like Look. **Not yet:** Email keeps its 240px list from `lg` (the
  picker shows only below `lg`) and splits `minmax(0,1fr)_minmax(420px,1fr)` at
  `xl`.
- A grid inside a column sizes from that column: `@container` on the card body
  and `@sm:grid-cols-2` on the grid.
- Pre-shell pages (workspace pending, tenant picker): a full-width
  `min-h-dvh bg-admin-bg` root holding one `<main>`, a centred `max-w-sm`
  column, a `Heading level={1} size="pageTitle"` with a supporting line, and the
  content in a `Card`. Choices are visible light-surface link rows, none
  pre-selected; dark sidebar components never sit on a light page.
- Full-bleed is for the mounted Studio only. Anything else on the Studio route
  (archived, not provisioned) renders in the normal padded column. **Not yet:**
  `ShellFrame` picks full-bleed from the `studio` segment alone, so
  `StudioMountView`'s archived and not-provisioned states render full-bleed; the
  fix belongs in `ShellFrame`, not a wrapper in the page.

## Cards

- Every content group in a page body is a `Card`. `Card.Footer` is only for a
  form's submit actions, right-aligned (an `ml-auto` group, as
  `tenant-details-panel-variants.ts` `footerActions`).
- `Card.Header` passes `headingLevel={2}`; a section nested under a card section
  passes 3. **Not yet:** the default is 3, so omitting it skips a level.
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
`app/[locale]/layout.tsx`. **Not yet:** nothing sets it, so admin text falls
through to the site's Newsreader serif (Space Grotesk on `h1`–`h4`), and
`config/font-loaders/inter-font.ts` ships 400–500 only while the primitives use
600, 650 and 700. Don't compensate in a component: no `font-sans`, `font-ui`,
inline `fontFamily` or `tracking-*`. `font-mono` is for domains, ids and DNS
values (`DetailList.Row isMono`).

| Role                                                         | Write                                                   | Renders                                                                                                                 |
| ------------------------------------------------------------ | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Page title                                                   | `PageHeader` `title`                                    | 22px, 700, `tracking-[-0.01em]`                                                                                         |
| Page description                                             | `PageHeader` `description`                              | 13.5px muted (`Text variant="supporting"`, kept for page descriptions only)                                             |
| Card title                                                   | `Card.Header` `title`                                   | 15px, 650 (`Heading size="cardTitle"`)                                                                                  |
| Dialog title                                                 | `AlertDialog.Title` at `cardTitle`                      | 15px, 650. **Not yet:** `ConfirmDialog`'s is 600                                                                        |
| Card description                                             | `Card.Header` `supportingText`                          | 12.5px muted                                                                                                            |
| Description or prose inside a card                           | `Text variant="muted"`                                  | 12.5px muted, never larger than the label above it                                                                      |
| Small title inside a card (step, notice, list item, summary) | the primitive's title slot                              | 13.5px, 600                                                                                                             |
| Field label                                                  | `FormField` `label`                                     | 13px, 600, field labels only                                                                                            |
| Field hint                                                   | `FormField` `hint`, a plain string                      | 12px muted, under the label, above the control. **Not yet:** 11.5px below the control                                   |
| Lock reason                                                  | `SettingRow` `lockedReason`                             | 12px muted, the hint style                                                                                              |
| Field error                                                  | `FormField` `error`                                     | 11.5px `admin-bad`, inline under the field                                                                              |
| Body: primary content and values                             | `Text` plus a `text-[13.5px] text-admin-text` slot      | 13.5px `admin-text`. **Not yet:** `Text` alone is unsized, so 16px                                                      |
| Read-only facts                                              | `DetailList` (`isMono` for domains, ids)                | 13.5px values, 12.5px muted terms, mono 12.5px                                                                          |
| Control text                                                 | `TextInput`, `Textarea`; `Button`                       | 13.5px (16px below `md`); 13px at `md`, 12px at `sm`. **Not yet:** `TextInput` and `Textarea` are 13.5px at every width |
| Table header; table cell                                     | the table recipe's `head`; its `cell`                   | 11px, 700, uppercase, `tracking-[.06em]`, muted (not `faint`); 13.5px `admin-text`, a second line 12px muted            |
| Badge                                                        | `StatusBadge`                                           | 11.5px, 600                                                                                                             |
| Caption, meta (a header count, a step time, a caption)       | `Text variant="meta"`                                   | 12px muted. **Not yet:** no `meta` variant; use `variant="muted"`                                                       |
| Empty state                                                  | one sentence in `Card.Body`; `emptyMessage` for a table | 13.5px muted; centred in a table                                                                                        |
| Save status                                                  | `SettingsFormShell` only                                | 12px `admin-ok`                                                                                                         |

- The site's named sizes (`text-xs`, `text-sm`, `text-base`, `text-label`,
  `text-meta`, …) never appear outside `site-preview/`. Admin sizes become
  `--text-admin-*` tokens in `styles/admin-theme.css`, each registered in
  `FONT_SIZE_TOKENS` in `utils/tv/tv.ts` or tailwind-merge drops it as a colour.
  **Not yet:** they don't exist; write the pixel value (`text-[13.5px]`) and
  invent no token names.
- A site preview applies the tenant's fonts by setting `--font-display-family`
  and `--font-body-family` on its root, never `--font-display`, `--font-read` or
  an inline `fontFamily`. **Not yet:** `voice-specimen.tsx` sets
  `--font-display`/`--font-read` and `look-sample.tsx` an inline `fontFamily`;
  don't copy either.

## Colour and contrast

- Colours come only from the `admin-*` tokens in `styles/admin-theme.css`: no
  hex, no raw palette colour, no site token outside `site-preview/`.
  `BrandMark`'s gradient and the preset swatches are artwork and exempt.
- `text-admin-text` for content, labels and values. `text-admin-muted` for
  descriptions, hints, terms, table headers, meta and timestamps. Semantic
  colours (`ok`, `warn`, `bad`, `brand`) only for state. `text-admin-faint`
  (3.1:1 on surface) only for decorative separators, placeholder glyphs and
  disabled text.
- Readable text is at least 4.5:1 against its surface (`admin-muted` is 5.98:1
  on surface, 5.58:1 on bg). Control boundaries, selection markers and focus
  indicators are at least 3:1 against what they sit on.
- Every control boundary is `border-admin-control-line` (3.48:1): text fields,
  the editor, selects, radio circles, the switch's off track, the segmented
  track, menu triggers. `border-admin-line` (1.24:1) is decorative structure
  only: card borders, dividers, the dashed upload box. **Not yet:** `TextInput`,
  `Textarea` and `PortableTextEditor` still draw an `admin-line` border, and
  `Switch`'s off track (`bg-admin-line`) and `SegmentedControl`'s track
  (`bg-admin-line-2`) are fills with no boundary. Compose them anyway; never copy
  them onto a new control.
- A selected item shows a 3:1 marker (`border-admin-brand`, a bar), not a
  `bg-admin-brand-weak` fill alone, and announces itself as pressed, checked or
  selected.
- Focus is `Button`'s ring (`focus-visible:ring-2`,
  `focus-visible:ring-admin-brand`, `focus-visible:ring-offset-2`, with
  `outline-hidden`); on the dark sidebar `ring-admin-side-accent` with
  `ring-offset-admin-side`. A text field turns its border `admin-brand`.
  `outline-admin-brand-weak` (1.12:1) is not a focus indicator. **Not yet:** it
  is still `Switch`'s only cue.
- **Not yet:** the sidebar section labels (3.16:1) fail. Their fix is a token
  change; don't override them per call site.
- `plan` is for plan tiers only.

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

- Radius: `rounded-admin` (12px) for containers (cards, notices, the save bar,
  dialogs); `rounded-admin-sm` (8px) for small items (chips, rows inside a card,
  code blocks); 9px for controls through `--radius-admin-control`. **Not yet:**
  that token doesn't exist. Get 9px by composing the primitive; a control that
  genuinely can't writes `rounded-[9px]`. Never a site radius (`rounded-md`,
  `-lg`, `-xl`) or 5, 7 or 10px.
- Elevation: `shadow-admin` on resting surfaces and controls, `shadow-admin-lg`
  on floating layers only (save bar, dialog, toast, popup). A notice nested in a
  card has no shadow. **Not yet:** `Alert` always carries one; don't override it
  per call site.

## Forms and settings

- A page that edits persisted tenant settings goes through `SettingsFormShell`:
  save bar, unsaved count, Cmd/Ctrl+S, the leave guard, draft recovery and the
  header's "All changes saved". No per-card Save, no page-level saved indicator.
  Success fires `toast.success`.
- Every text field is `FormTextInput`, or `FormField` around a control (the
  settings-fields recipe). `hint` is a plain string, never a sized `<span>` or a
  `<Text>`. A field's error is `FormField`'s inline `error`, never an `Alert` in
  the field; `invalidFieldIds` names the focusable controls, in page order. A
  failure that belongs to no field is one `Alert` (ERROR) under the header.
- An embedded edit panel outside the shell (today only the tenant details panel)
  calls `useUnsavedChangesGuard`, submits from a right-aligned `Card.Footer`,
  and shows its save error above the card. **Not yet:** `tenant-details-panel.tsx`
  calls no `useUnsavedChangesGuard` and renders its error `Alert` inside
  `Card.Body`.
- **Not yet:** `FormField` gives the hint no id, `FormTextInput` never links its
  error, and `SettingRow` gives its description and lock reason no id, so none
  is announced. That is fixed inside those primitives; don't wire it per call
  site (no `` `${id}-error` `` strings, no id'd span in `hint`, no ids threaded
  past `SettingRow`). Name the gap in your report.
- Use the shared controls (`Switch`, `SegmentedControl` for a small either/or,
  `TextInput`, `Textarea`, `PortableTextEditor`, `AssetUploadField`,
  `PresetPicker`, `FontPicker`, `HueSlider`). A mode one of them lacks belongs
  in it (raise it if your ticket doesn't cover it), never in a copy beside it.
- Archived tenant: `ArchivedTenantNotice` under the header. Every editing
  control takes its read-only look (`isReadOnly`), not `isDisabled`'s faint
  text; one with no read-only mode, such as `Switch`, takes `isDisabled`. Its
  `aria-describedby` includes the notice's id, joined with its hint and error
  ids, never replaced by them.
- Per-field status on Look, Voice and Email (unsaved dot, Default/Customised
  badge, Reset) sits in the field header; Reset is hidden when read-only. **Not
  yet:** there is no shared field-status component; follow
  `components/features/voice/voice-field-status/` (dot, badge) and `voice-field/`
  (Reset), except its `tone="plan"` Customised badge, which `plan` is not for.
- Buttons: one primary per surface; `md` by default; `sm` in `Card.Header`
  actions, a field's Reset and toolbars. A pending button uses `isPending` +
  `pendingLabel`. A destructive action goes through `ConfirmDialog`.

## Reusable blocks

- A page is composed from blocks in `components/shared/`. Look there before
  writing a feature component; when a block fits, use it, and a mode it lacks
  goes into the block, never into a copy beside it.
- A block is built on the Base UI part that owns the behaviour (`Field`,
  `Select`, `Collapsible`, `Tabs`, `Toolbar`, `Dialog`, `Switch`, …), styled
  from admin tokens in its `*-variants.ts`. It owns keyboard, focus and ARIA;
  callers pass content, through compound slots (`Card.Header`) or a small
  closed prop set, a hook or a context, never a long prop list.
- A pattern another domain's page needs becomes a shared block in that change,
  and both pages use it (CLAUDE.md → "A second copy moves to a shared folder";
  `platform-app.md` → File organisation).
- A feature component stays thin: it composes blocks and wires data. One that
  styles a raw Base UI part another page also uses is a block not yet extracted.

## Props

- **Seven props is the ceiling.** Count every member of the props type,
  including optional ones, `children` and `className`. A component that already
  has seven takes no new prop until it is restructured. Do that in the same PR
  or in one before it, then add the prop.
- Props stay one closed, named type, as `react-component-practices` requires. An
  object prop gets a named type too, and reuses a type that already exists
  (`TStagedImage`, a store record, a theme type) instead of a new bag of fields
  that copies one.
- When a component is over the limit or about to be, go down this list and use
  the first option that fits:
  1. **Drop the prop.**
     - If it is computed one-to-one from another prop (a label from `kind`, an
       ISO string from a `Date`, `isRejected` from `value`), derive it inside
       the component.
     - If every caller fills it the same way (one translated string, one Server
       Action, `hasArrow={true}`), the component owns it: call `useTranslations`
       or import the action directly.
     - If only a test passes it (`as`, an injected action,
       `onChange={() => undefined}`), delete it and have the test `vi.mock` the
       module.
  2. **Group the props.** Fields that always travel together become one object
     typed from their source: `owner: { email, joinedAt }`, `theme`, `record`,
     `sender`.
  3. **Use a slot.** Two or more props that only configure one region (a footer
     button with its pending and disabled flags, a trigger, a title and
     description) become one named `ReactNode` slot or a compound part
     (`Card.Header`). Resolve parts through `src/lib/react/compound.ts`, with
     each part in its own file.
  4. **Use a hook.** State plus handlers that every caller builds the same way
     by hand (open, typed value, error, `useTransition`, reset on close) move
     into a `use<Name>` hook. The component calls the hook itself, or takes its
     result as one object.
     - One consumer: `use-<name>.ts` in that component's folder.
     - A shared component's own hook: in that component's `shared/` folder
       (`settings-form-shell/use-settings-draft.ts`).
     - A second component starts using it: move it to `src/utils/use-<name>/`.
  5. **Use a context.** When the same values reach several components at
     different depths, or pass through a component that never reads them,
     provide them from the lowest common ancestor.
     - The provider and its `use<Name>()` hook live in one file, with a barrel
       that exports both.
     - App-wide or shell-wide contexts go in `src/context/<name>-provider/`
       (`toast-provider`, `unsaved-changes-provider`). A context for one domain
       goes in `src/components/features/<domain>/<name>-provider/`
       (`sidebar-collapse-provider`).
     - The hook throws outside its provider, unless having no provider has a
       safe meaning (for example, not archived and not pending).
- Never create a context for a single reader or to skip a single hop; pass the
  prop. A provider whose only consumer is its owner's direct child is just a
  prop with extra steps.
- Primitives in `src/components/shared/` stay prop-driven and read no app
  context. They take plain props such as `isDisabled`, `aria-describedby` and
  `value`, and feature components read the context and fill those props. The
  exceptions are a compound component's own internal context, Base UI's
  contexts, and the unsaved-changes guard, which `GuardedLink` and
  `SettingsFormShell` read from `@platform/context/unsaved-changes-provider` by
  design.
- Reach for Base UI before writing a new component or threading state through
  props.
  - `Field` (`Root`, `Label`, `Description`, `Error`, `Control`) wires up ids,
    `aria-describedby`, `aria-invalid` and disabled state.
  - `Dialog`, `AlertDialog`, `Menu`, `Popover`, `Collapsible` and `Tabs` own
    their open and selected state.
  - Compose the Base UI part, or the shared block built on it (see "Reusable
    blocks"). Don't add an id, `isInvalid` or `isOpen` prop that re-implements
    what the part already does.
- The one exception to the closed-props rule is a component used as a Base UI
  `render` target, such as the app's `Link`. It must accept and forward the ref
  and the props Base UI merges in. Check this before passing any closed-props
  component as `render`, and never close such a contract during a props cleanup.
- Test a component that reads a context inside the real provider, using one
  shared helper in `src/testing/`. Never use a stand-in provider written for one
  test file.

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
  - Data the request has already loaded for another purpose is not fetched again
    on open. Project the existing data instead.
- **Visible but slow data streams in.** Wrap the slow part (one card or one
  badge) in `<Suspense fallback={…}>` around an async Server Component that
  awaits it. Place the boundary as low as the slow part goes, so the rest of the
  page renders first.
  - This refines the rule in `react-component-practices` that the route does the
    fetching. In this app, a `*PageContent` component, or a Suspense-wrapped
    async section under `src/components/features/`, may load its own data
    through `@blog/db` or `src/server/`.
  - That is never allowed in a `'use client'` component or a `shared/`
    primitive.
  - To stream into a client component, pass it the server-rendered element as a
    `ReactNode` slot.
- **Every wait shows something.**
  - Each dynamic segment under a shell layout has a `loading.tsx` that renders a
    skeleton of the page. That file is also what lets `Link` prefetch a dynamic
    route.
  - A Suspense fallback for a card, table or list is a `Skeleton`
    (`components/shared/skeleton/`) shaped like the content it stands in for,
    with the same size and the same number of rows. **Not yet:** there is no
    `Skeleton`; until it lands, the fallback is the shared `Spinner` with a
    `label`.
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
  component reads during a request goes through a `cache()`-wrapped function,
  as the tenant resolvers do (`requireTenantById`, `resolveDashboardTenant`,
  `listSessionTenants`). **Not yet:** there is no cached `getSession`, and
  `requireAdmin` (with its `auth()` call) isn't `cache()`-wrapped.
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
- **Poll only while the result is on screen.**
  - Gate a polling hook on the same condition that renders its view
    (`isEnabled`).
  - Stop at a terminal state, cap the number of ticks, and pause while
    `document.visibilityState === 'hidden'`.
  - Delete any poll whose result no component renders.
  - After a mutation, call `router.refresh()` instead of leaving a poll running.

## Notices and states

- One notice primitive renders page notices and form results: `Alert` with an
  optional `action` and `role`. **Not yet:** `Alert` and `BannerState` are still
  separate. Use `Alert` for form and save results, and `BannerState` (or
  `ArchivedTenantNotice`) for a page notice with an action, directly under
  `PageHeader`. Never hand-build a tone box or add another notice style.
- A notice's title is a short phrase; the explanation is its description, at
  regular weight. Weight marks a title, never a sentence.
- An empty state never removes the card or the header. A card whose data doesn't
  exist yet says so in one body sentence, never a header alone.
- Loading uses `Spinner` with its `label`. A card waiting on a slow external
  call (Vercel) streams behind `Suspense` with a `Skeleton` fallback (**Not
  yet:** a `Spinner` until `Skeleton` lands), so `PageHeader` renders at once.
- A status line states only what happened: no "Checked just now" for a check
  that failed or never ran, and nothing is polled that the page doesn't show.
- `app/[locale]/not-found.tsx` and `error.tsx` render on the pre-shell `Card`
  layout. **Not yet:** neither exists; don't add per-page fallbacks.

## Phones (below `md`)

- Text fields are at least 16px (`text-[16px] md:text-[13.5px]`) so iOS doesn't
  zoom, and touch targets at least 44px (`min-h-11 md:min-h-0`). Both live in
  the primitives. **Not yet:** they don't; Voice and the save bar add them at
  call sites. Add no more call-site overrides to a shared primitive; a control
  you build yourself carries both.
- A page with an editor beside a preview gives phones Edit/Preview tabs below
  `lg` and renders only the active pane, whose `tabpanel` role applies below
  `lg` only. That is Look's `ViewTabs` (Base UI Tabs), for Look and Email; Voice
  keeps its per-card preview toggle. **Not yet:** `ViewTabs` lives in
  `components/features/look/look-form/components/view-tabs/` with Look's ids and
  labels, and Look's two panels carry `role="tabpanel"` at every width; its
  second consumer moves it to `components/shared/`, and the role drops at `lg`.
- A dialog keeps a 16px gutter (`w-[calc(100%-2rem)] max-w-md`). **Not yet:**
  `ConfirmDialog`'s popup is `w-full max-w-md`; only `LeavePageDialog` has it.
- Tables scroll sideways inside their card, and fact lists stack the term above
  the value. **Not yet:** `DataTableShell` has no scroll wrapper and
  `DetailList` keeps its 132px term column; fix them there, not per page.
- A Desktop/Mobile preview toggle is offered only where it changes what renders;
  an email's Desktop preview is a real 600px frame.
- Check in a browser at 375, 768, 1024 and 1280px, sidebar open and collapsed,
  in more than one locale.

## Headings and landmarks

- One `h1` per page (`PageHeader`, or the pre-shell page's own). Card titles are
  `h2`; a section inside one is `h3`. Nothing skipped, and what sits under a
  section heading nests below it.
- A site preview's root is `inert`: its links and buttons take no focus and its
  headings stay out of the admin outline.
- A landmark matches its content: no `<nav>` around a list with no links, no
  `<aside>` around main content.

## Copy

- Every visible string, `aria-label`, `title`, placeholder and `sr-only` text is
  a key in all five catalogues, `i18n/messages/{en,de,es,fr,nl}.json`; the app
  serves all five (`i18n/routing.ts`). Platform UI copy is never Voice.
- No literal in JSX, including `'(opens in new tab)'`, `'https://…'` and `'°'`.
- Never assemble a sentence in code: no `' — '` joins, no concatenation, no
  `toLowerCase()` or `toUpperCase()` on a translated string. One ICU message
  with arguments, a key per case, ICU plurals for counts, and the locale's date
  and list formatting.
- A Server Action returns a reason or field code; the client translates it with
  `useTranslations`.
- Icons are not copy: "Add tenant" renders `ICONS.PLUS` in the button, not
  `'+ '` in the string. Show names, not codes: the language name, not `EN`; the
  translated role, not `SUPERADMIN`.
- A settings page's success toast reads "{Page} saved." Copy on the owner tree
  (`/dashboard`) never mentions tenants, tables, packages, CSS variables, colour
  spaces or vendors.

## File size

A component or module over ~200 lines that does more than one job is split
before anything more is added to it, by context, per `web-component-practices` →
"Rule 3". A long file that does one job is fine. The shape to catch: one form
component holding value helpers, draft fields, save orchestration and two edit
panes.

## Red flags — stop

| You are about to write…                                                                                          | Write instead                                                                                                                                                        |
| ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<Text>` with no size slot, or `variant="muted"` / `"supporting"` to size a card's main content or value         | `Text` with the page recipe's `summary` slot (`text-[13.5px] text-admin-text`)                                                                                       |
| `<Text variant="hint">`                                                                                          | `FormField` `hint` for a field; `variant="muted"` for meta                                                                                                           |
| `text-sm`, `text-xs`, `text-base`, `text-label`, `text-meta`                                                     | The role's pixel value, e.g. `text-[13.5px]`                                                                                                                         |
| Table classes of your own: 18px cell padding, no row hover, a left-aligned empty line                            | The table recipe's variants, unchanged                                                                                                                               |
| A `div` with `rounded-admin border p-[18px] shadow-admin`                                                        | `<Card>` with `Card.Header` and `Card.Body`                                                                                                                          |
| A paragraph opening `Card.Body` that says what the card is for                                                   | `Card.Header` `supportingText`                                                                                                                                       |
| A hand-built tinted box with a glyph                                                                             | `Alert` or `BannerState`; a failure card is a `Card` with a bad header                                                                                               |
| A second `h1`, or `<Heading level={1}>` in a page body                                                           | `PageHeader` `title`, once per page                                                                                                                                  |
| `<h2>`, `<h3>` or a `font-semibold` span as a section title                                                      | `Card.Header` `title`                                                                                                                                                |
| `<Card.Header title={…}>` with no `headingLevel`                                                                 | `headingLevel={2}`                                                                                                                                                   |
| `hint={<span className="text-[11.5px] …">…</span>}`                                                              | `hint={t('…')}`                                                                                                                                                      |
| A field with a format rule and no `error`, `isInvalid` or `invalidFieldIds` entry, or an entry naming a wrapper  | The settings-fields recipe's error path, all four parts, with the focusable control's own id                                                                         |
| ``aria-describedby={`${id}-error`}`` beside `FormField`, or ids threaded past `SettingRow`                       | Nothing at the call site; report the gap                                                                                                                             |
| `<Alert>` inside a field for its validation error                                                                | `FormField` `error`                                                                                                                                                  |
| A switch blocked by the plan or a limit with no `lockedReason`                                                   | `isLocked` + a reason for every lock (settings-fields recipe)                                                                                                        |
| Half a not-yet fix in a primitive (the colour but not the size)                                                  | Leave it for its own change, or fix every class its rule names                                                                                                       |
| `border-admin-line` on a text field, select, track or radio                                                      | `border-admin-control-line`                                                                                                                                          |
| `text-admin-faint` on text someone has to read                                                                   | `text-admin-muted`                                                                                                                                                   |
| `text-indigo-800`, a hex, any raw palette colour                                                                 | An `admin-*` token                                                                                                                                                   |
| `outline-admin-brand-weak` as the only focus cue                                                                 | `Button`'s `focus-visible:ring-2` ring with offset                                                                                                                   |
| `gap-[18px]` or `gap-5` between cards, `gap-5` or `mb-[18px]` between fields                                     | `gap-6` between cards, `gap-4` on the fields' parent                                                                                                                 |
| `rounded-[10px]`, `rounded-[5px]`, `rounded-lg`, `rounded-xl`                                                    | `rounded-admin`, `rounded-admin-sm`, or the control primitive                                                                                                        |
| `font-sans`, `font-ui` or an inline `fontFamily` on admin chrome                                                 | Nothing; the font belongs on `<body>` (**Not yet:** unset, see Type)                                                                                                 |
| `sm:grid-cols-2` inside a half-width column                                                                      | `@container` on the body, `@sm:grid-cols-2` on the grid                                                                                                              |
| `@base-ui/react/switch` imported outside `shared/switch/`                                                        | The shared `Switch`; raise a missing mode                                                                                                                            |
| `{isPending ? t('saving') : t('save')}` as button children                                                       | `isPending` + `pendingLabel`                                                                                                                                         |
| The page's main action in the body, a non-form action in `Card.Footer`, a default-size `Button` in `Card.Header` | `PageHeader` `actions`; a card-scoped one as `size={SIZE.SM}` in `Card.Header` `actions`                                                                             |
| An English literal in JSX, an `aria-label` or a placeholder                                                      | A key in all five catalogues                                                                                                                                         |
| `label.toLowerCase()`, `` `${a} — ${b}` ``, `` `${hue}°` ``                                                      | One ICU message with arguments                                                                                                                                       |
| `min-h-11` or `text-[16px]` at a shared primitive's call site                                                    | Nothing; the primitive owns phone sizing                                                                                                                             |
| More code in a 200+ line component that does more than one job                                                   | Split it first                                                                                                                                                       |
| A feature component styling a Base UI part another page also uses                                                | A block in `components/shared/`, used from both pages                                                                                                                |
| An eighth prop, or any new prop on a component already at seven or more (`FormTextInput` has 12, `TextInput` 13) | Restructure first (drop, group, slot, hook or context), or compose its parts, as `FormField` around `TextInput`                                                      |
| A prop every caller fills the same way, derives one-to-one from another prop, or that only a test passes         | Own it inside the component (`useTranslations`, import the action, derive it); the test uses `vi.mock`                                                               |
| `isArchived` + `archivedNoticeId`, or the same set of values, passed to every card in a list                     | Read them from the form's context once `SettingsFormProvider` lands. **Not yet:** it doesn't exist; pass them as props and don't build a page-local context for them |
| Copying `useState` for open/value/error, `useTransition` and reset-on-close into another caller                  | One `use<Name>` hook; the component owns that state                                                                                                                  |
| Three booleans or handlers that configure one footer button or trigger                                           | A named `ReactNode` slot or a compound part                                                                                                                          |
| `const a = await x(); const b = await y();` where `y` doesn't use `a`                                            | `const [a, b] = await Promise.all([x(), y()])`                                                                                                                       |
| Calling `auth()`, `requireAdmin()` or a tenant query again in a layout or page                                   | The `cache()`-wrapped resolver the gate already used (`requireTenantById`, `resolveDashboardTenant`, `listSessionTenants`)                                           |
| `queries.tenants.getX(tenant.id)` when `tenant` is already in hand                                               | Derive it from the row, e.g. `queries.tenants.selectLiveLocales(tenant)`                                                                                             |
| Awaiting a slow external call (the Vercel API) in a page's top-level `Promise.all`                               | An async section inside `<Suspense>`, fallback `Skeleton` (**Not yet:** `Spinner`)                                                                                   |
| Loading data that only a closed Disclosure, Menu or inactive tab shows                                           | A Server Action called on first open with a `Spinner`, or a route segment per tab                                                                                    |
| `tenant={row}` or `hrefFor={() => …}` passed to a `'use client'` component                                       | A server-side projection of only the fields it renders, with hrefs computed on the server                                                                            |
| A `setInterval` poll inside a hook that runs on every render path                                                | Gate it on the condition that renders its view, stop at a terminal state, cap ticks, and pause while the tab is hidden                                               |
| A dynamic route with no `loading.tsx`, or a `router.push` with no pending state                                  | A `loading.tsx` page skeleton; `startTransition` plus a `Spinner`                                                                                                    |
