# Phase 3 — Voice-as-Content — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. **This repo delegates every layer file to its owning subagent** (`config`/`cms`/`service`/`web`, + `test-writer`) — so each task below is a **dispatch** with exact files, contracts, and acceptance tests, **not** pre-authored code the orchestrator writes to disk. Follow `develop-feature` for the gate sequence. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the site's copy into a configurable axis, the same way Phase 2 turned look into one. Every console-voiced string in `apps/web/src/i18n/messages/en.json` is preserved byte-for-byte into a code-owned `console` voice-pack (Step 0, gates everything else); `en.json`'s base is then neutralized; a curated set of the preserved strings becomes CMS-overridable. `console` renders today's exact wording; `editorial` renders the neutral wording; a CMS override changes one key without touching its siblings.

**Architecture:** `config` gains a `CONSOLE_VOICE_PACK`/`EDITORIAL_VOICE_PACK` pair (`TVoicePack` — a deep-partial mirror of the affected `en.json` subtree) wired into `PRESET_REGISTRY`'s `voicePack` slot, replacing Phase 2's `Record<string, never>` placeholder. `cms` gets a `settings_voice` singleton exposing ~20 curated override fields. `service` fetches it and fans the CMS fields out into the same nested shape as `TVoicePack` (one CMS field, `terminalPromptHost`, fans out to 4 message paths). `web`'s `next-intl` request config resolves the active preset, then deep-merges `neutral en.json base ← preset voicePack ← CMS overrides` before handing messages to `next-intl`. `@blog/ui` is untouched — this phase only ever changes what `t()` returns, never how it's wrapped in chrome (that composition work is a separate, sibling epic — see "Explicitly out of scope" below).

**Tech Stack:** `@blog/config` consts; a new generic deep-merge utility in `@blog/utils`; Sanity v6 schema + typegen; groqd projections in `@blog/service`; `next-intl`'s `getRequestConfig`; Vitest.

## Global Constraints

_(Inherited from the rollout plan's Global Constraints. Repeated highlights:)_

- **Step 0 is a hard gate.** Nothing in Tasks 4+ (neutralizing `en.json`, wiring the merge) proceeds until Task 2's preservation pack + completeness test are committed and reviewed. This is non-negotiable per spec D5.
- **Only non-neutral strings move.** A string stays in `en.json`'s base untouched if and only if it carries no console-specific terminal syntax, filesystem-path reference, command/state/toast-log framing, or deliberately-casual/lowercase styling distinct from the site's normal Title-Case/sentence-case copy. The full classification (every key in `en.json`, not just the spec's six named examples) is locked in this plan's Contracts section — no further judgment calls at implementation time.
- **`console` must reproduce today's exact wording.** The completeness test asserts this per-key, not just informally.
- **`editorial`'s voice pack is empty (`{}`).** Once `en.json`'s base is neutralized, "editorial renders neutral wording" is just "editorial applies no overrides" — the simplest possible v1 contrast (D6).
- **UPPERCASE key/value consts**, `as const`, in `@blog/config`; ordinary data consts (`CONSOLE_VOICE_PACK`, `EDITORIAL_VOICE_PACK`) are plain-cased since they're data payloads, not enum pairs — matches `PRESET_REGISTRY` itself.
- **Migration: none.** `settings_voice` is a new additive singleton; every field optional; absent = falls back through the ladder to the preset pack, then to the neutral base.
- **`@blog/ui` gets zero edits this phase.** Only `t()` outputs change; component composition (which is chrome-wrapped vs. plain) is explicitly out of scope — see below.
- After the schema change: `pnpm typegen` (orchestrator runs it in-session), commit regenerated `packages/config/src/sanity/generated/`.
- Co-locate `*.test.ts(x)`; `pnpm test` + `pnpm type-check` + `pnpm lint` pass.
- Cache the CMS voice-override fetch the same way `theme-settings` does (`isr('...')` tag), so `next-intl`'s per-request message resolution doesn't add an uncached Sanity round-trip.

**Explicitly out of scope (deliberately, not an oversight):**

- **Chrome composition gating** (`WindowChrome`/`TerminalChip`/`Toast` still render unconditionally regardless of `chromeOn`) — this is a Phase 2 (`sub-project A`, `chromeOn` lives on `TThemeTokens`) loose end, not a voice concern. It's being filed as its own sibling epic, parented to #1285, with `ui` (a plain `Toast` presentation mode — the only one of the 8 chrome call sites that needs an actual `@blog/ui` change, since it's a singleton provider) and `web` (7 call-site swaps to plain markup using existing pure primitives) sub-issues. This phase's acceptance criteria ("editorial renders the neutral wording") is about **copy**, not chrome visibility — both are independently true/testable.
- **Email templates** (`apps/web/src/server/auth/magic-link-email.ts`, `apps/web/src/server/newsletter/newsletter-confirmation-email.ts`) — hardcoded HTML strings entirely outside `next-intl`/the voice-pack system. Flagged as its own follow-up issue; not this phase's spec'd surface (sub-project B only covers `next-intl` messages).
- **Every other console-flavored string beyond the classification below stays put** — e.g. `bookmarkButton.toastRevertedMessage`/`toastRevertedState` values ("reverted") get preserved into the pack (they're console-styled) but are **not** in the curated CMS-override set — a tenant can't edit them from the CMS in v1, only the neutral/console/editorial distinction applies. This is intentional per D1 ("curated, not full control").

---

## Contracts (locked here; every task uses these exact names)

### `TVoicePack` — `packages/config/src/constants/voice-pack.ts`

A deep-partial, hand-declared mirror of the affected subtree of `apps/web/src/i18n/messages/en.json`'s shape (config cannot import web's message type — wrong layer direction — so this is duck-typed against it, not derived; the completeness test is the drift guard).

```ts
export type TVoicePack = {
  notFound?: {
    metaTitle?: string;
    metaDescription?: string;
    commandNotFound?: string;
    description?: string;
    returnHome?: string;
  };
  authMenu?: {
    guestLabel?: string;
    promptHost?: string;
    promptCommandSignIn?: string;
    promptCommandAccount?: string;
    chooseProviderPrompt?: string;
  };
  bookmarkButton?: {
    save?: string;
    saved?: string;
    toastCommand?: string;
    toastSavedState?: string;
    toastSavedMessage?: string;
    toastRemovedState?: string;
    toastRemovedMessage?: string;
    toastErrorState?: string;
    toastRevertedState?: string;
    toastRevertedMessage?: string;
    toastUndoLabel?: string;
    toastRetryLabel?: string;
  };
  bookmarksPage?: {
    promptSymbol?: string;
    promptCommand?: string;
    promptFlag?: string;
  };
  newsletterForm?: {
    trustCueNoSpam?: string;
    trustCueUnsubscribe?: string;
  };
  accountPage?: {
    privacy?: {
      promptHost?: string;
      promptCommand?: string;
      promptTag?: string;
      exportButton?: string;
      deleteLabel?: string;
      deleteConfirmPlaceholder?: string;
      deleteButton?: string;
      deleteToastCommand?: string;
      deleteToastLoadingState?: string;
      deleteToastSuccessState?: string;
      deleteToastErrorState?: string;
    };
    newsletter?: {
      promptHost?: string;
      promptCommand?: string;
      activeBadge?: string;
      unsubscribeButton?: string;
      pendingBadge?: string;
      resendButton?: string;
      unsubscribeToastCommand?: string;
      unsubscribeToastLoadingState?: string;
      unsubscribeToastSuccessState?: string;
      unsubscribeToastErrorState?: string;
      resendToastCommand?: string;
      resendToastLoadingState?: string;
      resendToastSuccessState?: string;
      resendToastErrorState?: string;
    };
    identity?: {
      promptHost?: string;
      promptCommand?: string;
      linkedStatus?: string;
      linkButton?: string;
      unlinkButton?: string;
      lastMethodNotice?: string;
      unlinkToastCommand?: string;
      unlinkToastLoadingState?: string;
      unlinkToastSuccessState?: string;
      unlinkToastErrorState?: string;
      saveButton?: string;
      saveToastCommand?: string;
      saveToastLoadingState?: string;
      saveToastSuccessState?: string;
      saveToastErrorState?: string;
    };
  };
};
```

### The full classification — every console-voiced key, its **current** value, and the **neutralized** value it gets in `en.json`'s base

This is Step 0's exact scope. Every row below moves into `CONSOLE_VOICE_PACK` verbatim (current value) **and** gets its `en.json` value replaced with the neutralized one. Every `en.json` key not listed here is already neutral and stays byte-for-byte unchanged — do not touch it.

Two values are shared across multiple paths and get a single named constant, reused:

```ts
const TERMINAL_PROMPT_HOST = '~$'; // authMenu.promptHost, accountPage.{privacy,newsletter,identity}.promptHost
const TOAST_FAILED_STATE = 'failed'; // bookmarkButton.toastErrorState, accountPage.privacy.deleteToastErrorState,
// accountPage.newsletter.{unsubscribe,resend}ToastErrorState, accountPage.identity.{unlink,save}ToastErrorState
```

| Key path                                              | Current (→ `CONSOLE_VOICE_PACK`)                 | Neutralized `en.json` base                     |
| ----------------------------------------------------- | ------------------------------------------------ | ---------------------------------------------- |
| `notFound.commandNotFound`                            | `"command not found"`                            | `"Not found"`                                  |
| `notFound.description`                                | `"That route doesn't resolve to anything here."` | `"The page you're looking for doesn't exist."` |
| `authMenu.guestLabel`                                 | `"guest"`                                        | `"Guest"`                                      |
| `authMenu.promptHost`                                 | `TERMINAL_PROMPT_HOST`                           | `""` (see note below)                          |
| `authMenu.promptCommandSignIn`                        | `"auth login"`                                   | `"Sign in"`                                    |
| `authMenu.promptCommandAccount`                       | `"whoami"`                                       | `"Account"`                                    |
| `authMenu.chooseProviderPrompt`                       | `"choose a provider"`                            | `"Choose a sign-in method"`                    |
| `bookmarkButton.save`                                 | `"save"`                                         | `"Save"`                                       |
| `bookmarkButton.saved`                                | `"saved"`                                        | `"Saved"`                                      |
| `bookmarkButton.toastCommand`                         | `"bookmark"`                                     | `"Bookmark"`                                   |
| `bookmarkButton.toastSavedState`                      | `"saved"`                                        | `"Saved"`                                      |
| `bookmarkButton.toastSavedMessage`                    | `"stashed to ~/bookmarks"`                       | `"Saved to bookmarks"`                         |
| `bookmarkButton.toastRemovedState`                    | `"removed"`                                      | `"Removed"`                                    |
| `bookmarkButton.toastRemovedMessage`                  | `"removed from ~/bookmarks"`                     | `"Removed from bookmarks"`                     |
| `bookmarkButton.toastErrorState`                      | `TOAST_FAILED_STATE`                             | `"Failed"`                                     |
| `bookmarkButton.toastRevertedState`                   | `"reverted"`                                     | `"Reverted"`                                   |
| `bookmarkButton.toastRevertedMessage`                 | `"reverted"`                                     | `"Reverted"`                                   |
| `bookmarkButton.toastUndoLabel`                       | `"undo"`                                         | `"Undo"`                                       |
| `bookmarkButton.toastRetryLabel`                      | `"retry"`                                        | `"Retry"`                                      |
| `bookmarksPage.promptSymbol`                          | `"$"`                                            | `""` (see note below)                          |
| `bookmarksPage.promptCommand`                         | `"ls ~/bookmarks"`                               | `"My bookmarks"`                               |
| `bookmarksPage.promptFlag`                            | `"-l"`                                           | `""` (see note below)                          |
| `newsletterForm.trustCueNoSpam`                       | `"no spam"`                                      | `"No spam"`                                    |
| `newsletterForm.trustCueUnsubscribe`                  | `"unsubscribe in one line"`                      | `"Unsubscribe anytime"`                        |
| `accountPage.privacy.promptHost`                      | `TERMINAL_PROMPT_HOST`                           | `""` (see note below)                          |
| `accountPage.privacy.promptCommand`                   | `"account --privacy"`                            | `"Privacy"`                                    |
| `accountPage.privacy.promptTag`                       | `"data"`                                         | `""` (see note below)                          |
| `accountPage.privacy.exportButton`                    | `"↓ request export"`                             | `"Request export"`                             |
| `accountPage.privacy.deleteLabel`                     | `"⚠ Delete account"`                             | `"Delete account"`                             |
| `accountPage.privacy.deleteConfirmPlaceholder`        | `"type: {handle}"`                               | `"Type {handle} to confirm"`                   |
| `accountPage.privacy.deleteButton`                    | `"delete account"`                               | `"Delete account"`                             |
| `accountPage.privacy.deleteToastCommand`              | `"account"`                                      | `"Account"`                                    |
| `accountPage.privacy.deleteToastLoadingState`         | `"deleting"`                                     | `"Deleting"`                                   |
| `accountPage.privacy.deleteToastSuccessState`         | `"deleted"`                                      | `"Deleted"`                                    |
| `accountPage.privacy.deleteToastErrorState`           | `TOAST_FAILED_STATE`                             | `"Failed"`                                     |
| `accountPage.newsletter.promptHost`                   | `TERMINAL_PROMPT_HOST`                           | `""` (see note below)                          |
| `accountPage.newsletter.promptCommand`                | `"account --email"`                              | `"Newsletter"`                                 |
| `accountPage.newsletter.activeBadge`                  | `"subscribed"`                                   | `"Subscribed"`                                 |
| `accountPage.newsletter.unsubscribeButton`            | `"unsubscribe"`                                  | `"Unsubscribe"`                                |
| `accountPage.newsletter.pendingBadge`                 | `"pending confirmation"`                         | `"Pending confirmation"`                       |
| `accountPage.newsletter.resendButton`                 | `"↻ resend confirmation"`                        | `"Resend confirmation"`                        |
| `accountPage.newsletter.unsubscribeToastCommand`      | `"newsletter"`                                   | `"Newsletter"`                                 |
| `accountPage.newsletter.unsubscribeToastLoadingState` | `"unsubscribing"`                                | `"Unsubscribing"`                              |
| `accountPage.newsletter.unsubscribeToastSuccessState` | `"unsubscribed"`                                 | `"Unsubscribed"`                               |
| `accountPage.newsletter.unsubscribeToastErrorState`   | `TOAST_FAILED_STATE`                             | `"Failed"`                                     |
| `accountPage.newsletter.resendToastCommand`           | `"newsletter"`                                   | `"Newsletter"`                                 |
| `accountPage.newsletter.resendToastLoadingState`      | `"resending"`                                    | `"Resending"`                                  |
| `accountPage.newsletter.resendToastSuccessState`      | `"resent"`                                       | `"Resent"`                                     |
| `accountPage.newsletter.resendToastErrorState`        | `TOAST_FAILED_STATE`                             | `"Failed"`                                     |
| `accountPage.identity.promptHost`                     | `TERMINAL_PROMPT_HOST`                           | `""` (see note below)                          |
| `accountPage.identity.promptCommand`                  | `"account --identities"`                         | `"Connected accounts"`                         |
| `accountPage.identity.linkedStatus`                   | `"✓ linked"`                                     | `"Linked"`                                     |
| `accountPage.identity.linkButton`                     | `"link"`                                         | `"Link"`                                       |
| `accountPage.identity.unlinkButton`                   | `"unlink"`                                       | `"Unlink"`                                     |
| `accountPage.identity.lastMethodNotice`               | `"last remaining method — can't unlink"`         | `"Last remaining method — can't unlink"`       |
| `accountPage.identity.unlinkToastCommand`             | `"identity"`                                     | `"Identity"`                                   |
| `accountPage.identity.unlinkToastLoadingState`        | `"unlinking"`                                    | `"Unlinking"`                                  |
| `accountPage.identity.unlinkToastSuccessState`        | `"unlinked"`                                     | `"Unlinked"`                                   |
| `accountPage.identity.unlinkToastErrorState`          | `TOAST_FAILED_STATE`                             | `"Failed"`                                     |
| `accountPage.identity.saveButton`                     | `"save"`                                         | `"Save"`                                       |
| `accountPage.identity.saveToastCommand`               | `"identity"`                                     | `"Identity"`                                   |
| `accountPage.identity.saveToastLoadingState`          | `"saving"`                                       | `"Saving"`                                     |
| `accountPage.identity.saveToastSuccessState`          | `"saved"`                                        | `"Saved"`                                      |
| `accountPage.identity.saveToastErrorState`            | `TOAST_FAILED_STATE`                             | `"Failed"`                                     |

**`promptSymbol`/`promptHost`/`promptFlag`/`promptTag` neutralize to `""` (empty string), not a rewritten word.** These four fields exist purely to render terminal-prompt _furniture_ (the `~$`/`$`/`-l`/`data` glyphs `WindowChrome.Prompt`/`WindowChrome.Tag` render literally as typed). There is no neutral English equivalent of a shell prompt symbol — the neutral/editorial UI simply doesn't have a prompt-line element there at all (this is exactly the composition-level gap the sibling chrome-gating epic closes; until it does, these four fields render as an empty string in the still-present `WindowChrome.Prompt`/`.Tag` slot, which is a harmless empty span, not broken markup — confirmed by checking `WindowChrome.Prompt`/`.Tag`'s implementation renders whatever string it's given with no assumed non-empty formatting).

**64 distinct message paths** move into the pack (2 shared constants collapse what would otherwise be 6 duplicate entries — `TERMINAL_PROMPT_HOST` used at 4 paths, `TOAST_FAILED_STATE` used at 6 — down to 2 declarations).

### `CONSOLE_VOICE_PACK` / `EDITORIAL_VOICE_PACK` — `packages/config/src/constants/voice-pack.ts`

```ts
export const CONSOLE_VOICE_PACK: TVoicePack = {
  // populated per the table above, nested per TVoicePack's shape
};

export const EDITORIAL_VOICE_PACK: TVoicePack = {};
```

### Deep-merge utility — `packages/utils/src/merge/deep-merge.ts`

```ts
export function deepMergePartial<T extends Record<string, unknown>>(
  base: T,
  ...overrides: Array<DeepPartial<T> | undefined>
): T;
```

Merges plain nested objects key-by-key (an override's `undefined`/absent key leaves the base's value in place; a defined leaf value replaces it — never array-merges, since every leaf in this shape is a string). Mirrors the existing one-folder-per-domain layout (`async/`, `color/`, `pagination/`, `primitives/`, `reading-time/`).

### `settings_voice` singleton — curated CMS override fields

The **narrow** set confirmed with the user — 20 fields, each optional, blank = falls through to the preset pack → neutral base. `terminalPromptHost` is the one field that fans out to 4 message paths (service's job, Task 6):

```
notFoundMetaTitle          → notFound.metaTitle
notFoundMetaDescription    → notFound.metaDescription
notFoundCommandNotFound    → notFound.commandNotFound
notFoundDescription        → notFound.description
notFoundReturnHome         → notFound.returnHome
terminalPromptHost         → authMenu.promptHost, accountPage.privacy.promptHost,
                              accountPage.newsletter.promptHost, accountPage.identity.promptHost
authPromptCommandSignIn    → authMenu.promptCommandSignIn
authPromptCommandAccount   → authMenu.promptCommandAccount
bookmarksPromptCommand     → bookmarksPage.promptCommand
accountPrivacyPromptCommand   → accountPage.privacy.promptCommand
accountNewsletterPromptCommand → accountPage.newsletter.promptCommand
accountIdentityPromptCommand   → accountPage.identity.promptCommand
bookmarkToastSavedMessage   → bookmarkButton.toastSavedMessage
bookmarkToastRemovedMessage → bookmarkButton.toastRemovedMessage
blogListEmpty               → blogListPage.empty
categoryEmpty                → categoryPage.empty
tagEmpty                     → tagPage.empty
authorEmpty                  → authorPage.empty
topicsEmpty                  → topicsPage.empty
bookmarksEmpty                → bookmarksPage.empty
```

`notFound.returnHome`, the `*Empty` fields, and `notFound.metaTitle`/`metaDescription` aren't in the console-voiced classification table above (they're already neutral in both presets) — they're still CMS-overridable because the curated set is about "what copy a tenant plausibly wants to brand," not strictly "what differs between console and editorial." This matches the spec's own framing (toasts/404/prompts/**empty states** — empty states were never claimed to be console-specific).

---

## Sequencing note

Tasks 1–3 (utils + config: deep-merge, voice-pack consts + completeness test) have no CMS/schema dependency and land as one early PR — this **is** Step 0, and nothing in Tasks 4+ starts until it's merged. Task 4 (web: neutralize `en.json`) depends on Task 2's pack being locked (so the values being removed from `en.json` are provably preserved elsewhere first). Tasks 5 (cms) → 6 (service) → 7 (web: merge wiring) follow the usual dependency order and can start once Task 4 lands, since neither needs the schema in place to be scaffolded (Task 6 mocks the query result same as `theme-settings`'s own tests do).

---

### Task 1: `@blog/utils` — generic deep-merge utility

**Dispatch:** `config` subagent (owns `packages/utils`).

**Files:**

- Create: `packages/utils/src/merge/deep-merge.ts` — `deepMergePartial<T>(base, ...overrides)`, plus an exported `DeepPartial<T>` helper type if one doesn't already exist in `@blog/config/utils` (check `packages/config/src/utils` first — `TValueOf` lives there; if `DeepPartial` isn't already defined anywhere in the monorepo, declare it here since this is the first consumer).
- Modify: `packages/utils/src/index.ts` — export the new function (+ type, if declared here).
- Test: `packages/utils/src/merge/deep-merge.test.ts` — cases: (a) override's nested partial replaces only the leaf keys it sets, siblings untouched; (b) multiple overrides applied left-to-right, each later one winning; (c) an override with no matching top-level key at all leaves `base` fully unchanged; (d) an `undefined` override argument (e.g. "no CMS overrides configured") is a no-op, not a crash.

**Interfaces — Produces:** `deepMergePartial<T extends Record<string, unknown>>(base: T, ...overrides: Array<DeepPartial<T> | undefined>): T` from `@blog/utils`.

- [ ] **Step 1 (failing test):** Write `deep-merge.test.ts` covering the four cases above against a small fixture shape (e.g. `{ a: { x: string; y: string }; b: string }`), not the full `TVoicePack` (keep the unit test shape-agnostic).
- [ ] **Step 2:** Run — Expected: FAIL (`deepMergePartial` doesn't exist).
- [ ] **Step 3:** Implement `deepMergePartial` (plain recursive object merge — no external dependency needed, the nesting depth here is shallow and known).
- [ ] **Step 4:** Run — Expected: PASS.
- [ ] **Step 5:** Verify `pnpm --filter @blog/utils type-check` / test / lint.
- [ ] **Step 6:** Commit (`feat(config): add generic deep-merge utility for the voice override ladder`).

---

### Task 2: `@blog/config` — `TVoicePack` + `CONSOLE_VOICE_PACK`/`EDITORIAL_VOICE_PACK` (Step 0's extraction)

**Dispatch:** `config` subagent, then `test-writer` for the completeness test. **This is Step 0 — the hard gate.** Nothing downstream starts until this task is committed.

**Files:**

- Create: `packages/config/src/constants/voice-pack.ts` — `TVoicePack` (exact shape from Contracts), `TERMINAL_PROMPT_HOST`/`TOAST_FAILED_STATE` shared constants, `CONSOLE_VOICE_PACK`/`EDITORIAL_VOICE_PACK`, populated **exactly** per the classification table above (copy each "Current" value verbatim — these are the literal strings from today's `en.json`, read directly from `apps/web/src/i18n/messages/en.json` at commit time, not retyped from memory).
- Modify: `packages/config/src/constants/preset.ts` — change `TPresetBundle.voicePack`'s type from `Record<string, never>` to `TVoicePack`; update `PRESET_REGISTRY[PRESET_ID.CONSOLE].voicePack` to `CONSOLE_VOICE_PACK` and `PRESET_REGISTRY[PRESET_ID.EDITORIAL].voicePack` to `EDITORIAL_VOICE_PACK`.
- Modify: `packages/config/src/constants/index.ts` (barrel) — export `TVoicePack`, `CONSOLE_VOICE_PACK`, `EDITORIAL_VOICE_PACK`.
- Test: `packages/config/src/constants/voice-pack.test.ts` — **one assertion per row of the classification table** (64 assertions), each hardcoding the expected preserved value directly in the test (not reading `en.json` at test time — this test must keep passing even after Task 4 changes `en.json`, since it's asserting the **pack's** contents, the durable regression guard per spec's "a test proves the Step 0 extraction lost no console string"). Example:

```ts
import { CONSOLE_VOICE_PACK } from './voice-pack';

describe('CONSOLE_VOICE_PACK', () => {
  it('preserves every console-voiced string from the pre-neutralization en.json', () => {
    expect(CONSOLE_VOICE_PACK.notFound?.commandNotFound).toBe(
      'command not found',
    );
    expect(CONSOLE_VOICE_PACK.authMenu?.promptHost).toBe('~$');
    expect(CONSOLE_VOICE_PACK.bookmarkButton?.toastSavedMessage).toBe(
      'stashed to ~/bookmarks',
    );
    // ...one line per remaining row in the classification table, 64 total
  });

  it('reuses the shared terminal-prompt-host constant at all four call sites', () => {
    const host = CONSOLE_VOICE_PACK.authMenu?.promptHost;
    expect(CONSOLE_VOICE_PACK.accountPage?.privacy?.promptHost).toBe(host);
    expect(CONSOLE_VOICE_PACK.accountPage?.newsletter?.promptHost).toBe(host);
    expect(CONSOLE_VOICE_PACK.accountPage?.identity?.promptHost).toBe(host);
  });
});
```

**Interfaces — Produces:** `TVoicePack`, `CONSOLE_VOICE_PACK`, `EDITORIAL_VOICE_PACK` from `@blog/config`. `PRESET_REGISTRY[*].voicePack` now typed `TVoicePack` (was `Record<string, never>`).

- [ ] **Step 1:** Dispatch `config` to create `voice-pack.ts` with the exact contents from the Contracts section, reading `en.json`'s current values directly to confirm each copied string is exact (byte-for-byte, including the em-dash in `lastMethodNotice` and every symbol prefix).
- [ ] **Step 2 (test-writer):** Write `voice-pack.test.ts` per the pattern above — all 64 rows plus the shared-constant reuse assertion.
- [ ] **Step 3:** Run `pnpm --filter @blog/config test` — Expected: PASS (this isn't TDD-red-first since the pack and the test both encode the same already-known values; the test's job is regression-locking, not driving new behavior).
- [ ] **Step 4:** Verify `pnpm --filter @blog/config type-check`; confirm `preset.ts`'s `PRESET_REGISTRY` still type-checks with the new `TVoicePack` type.
- [ ] **Step 5:** Commit (`feat(config): extract console voice pack, wire PRESET_REGISTRY's voicePack slot`).
- [ ] **Step 6 (orchestrator checkpoint — do not skip):** Before Task 4 starts, manually diff every row of the classification table above against the actual current `apps/web/src/i18n/messages/en.json` one more time, side-by-side. This is the human/orchestrator review gate the user asked for ("make sure only neutral is left untouched") — confirm no console-voiced string was missed and no neutral string was wrongly included, before any `en.json` value changes.

---

### Task 3: `apps/web` — neutralize `en.json`'s base wording

**Dispatch:** `web` subagent. **Starts only after Task 2 Step 6's checkpoint passes.**

**Files:**

- Modify: `apps/web/src/i18n/messages/en.json` — replace every "Current" value in the classification table with its "Neutralized" value, **at the same key path** (no key renames, no key removals/additions — this is a pure value-level edit). Every other key in the file stays byte-for-byte identical.
- Test: no new test file — the existing `notFound`/`bookmarksPage`/`accountPage`/`authMenu` component tests that assert on rendered text (if any assert literal English strings rather than mocking `t()`) may need their expected strings updated to match the new neutral wording; grep for hardcoded assertions against any of the 64 changed values across `apps/web/src/**/*.test.tsx` and update them in this same task (they're testing the same behavior, just against updated fixture copy — not new test cases).

**Interfaces — Consumes:** the classification table (Contracts section) as the literal source of truth for both old and new values.

- [ ] **Step 1:** Dispatch `web` to edit `en.json` per the table, then grep `apps/web/src` for any test asserting one of the 64 old literal strings and update those assertions to the new neutral wording.
- [ ] **Step 2:** Run `pnpm --filter web test` — Expected: PASS (any test that broke on the copy change now passes with updated expectations; nothing else should be affected since key paths didn't move).
- [ ] **Step 3:** Verify `pnpm --filter web type-check` + lint.
- [ ] **Step 4:** Commit (`feat(web): neutralize en.json base wording, console voice preserved in the preset pack`).

---

### Task 4: `apps/cms` — `settings_voice` singleton

**Dispatch:** `cms` subagent. **Then orchestrator runs `pnpm typegen`.**

**Files:**

- Create: `apps/cms/src/schema-types/documents/settings/voice.ts` — `settings_voice` singleton, following `theme.ts`'s exact pattern (`defineType`, `titleField()`, `preview.prepare`). All 20 fields from the Contracts section, type `string`, all optional (no `.required()` — blank means "fall through the ladder"). Group into `fieldsets` for Studio usability (4 groups matching the table's own grouping: "404 page", "Terminal prompts", "Bookmarks", "Empty states") — mirror however this repo's other multi-section schemas use `fieldsets` (check `apps/cms/src/schema-types/documents/settings/site-settings.ts` or the `module_*` schemas for the existing `fieldsets` convention before inventing a new one). Each field's `description` states which page/component it overrides and that it falls back to the preset's own wording when blank, matching `theme.ts`'s description style (e.g. `"Leave blank to use the preset's own 404 message."`).
- Register `settings_voice` in `apps/cms/src/schema-types/documents/index.ts` (same list `themeSchema`/`newsletterSettingsSchema` are in).

**Interfaces — Consumes:** nothing from other layers (plain string fields).
**Produces:** after typegen, `SettingsVoice` in the generated types — one optional string field per the 20 names in the Contracts section.

- [ ] **Step 1:** Dispatch `cms` to create `voice.ts` with the 20 fields (exact names from Contracts), grouped fieldsets, register it in `documents/index.ts`.
- [ ] **Step 2:** Orchestrator runs `pnpm typegen`; re-run until the diff is minimal; commit `packages/config/src/sanity/generated/`.
- [ ] **Step 3:** Verify `pnpm --filter cms type-check`; confirm `SettingsVoice`'s 20 fields appear correctly in the generated types.
- [ ] **Step 4:** Commit (`feat(cms): add settings_voice singleton with curated brand-voice override fields`). No migration needed (new additive singleton) — state so explicitly in the PR body.

---

### Task 5: `@blog/service` — fetch voice overrides, resolve the active preset

**Dispatch:** `service` subagent, then `test-writer` for the fetcher/transformer tests.

**Files:**

- Modify: `packages/service/src/features/global/theme-settings/adaptor/transformer.ts` — `toThemeTokens` also returns `preset: TPresetId` (the resolved preset id, already computed internally as `const preset = raw?.preset ?? PRESET_ID.CONSOLE` — just add it to the returned object).
- Modify: `packages/config/src/constants/preset.ts`'s `TThemeTokens` — add `preset: TPresetId` (a small, additive extension of an already-shipped type; every existing consumer that only reads the fields it already knew about is unaffected).
- Modify: `packages/service/src/features/global/theme-settings/adaptor/types.ts` and any test fixtures asserting a full `TThemeTokens` shape (existing `theme-settings` tests) — add the new `preset` field to expected results.
- Create: `packages/service/src/features/global/voice-settings/` — mirrors `theme-settings/`'s exact structure:
  - `adaptor/query.ts` — groqd query against `settings_voice`, all 20 fields `.nullable(true)` (the whole document may not exist).
  - `adaptor/transformer.ts` — `toVoiceOverrides(raw): TVoicePack` fans the 20 flat CMS fields out into the nested `TVoicePack` shape per the Contracts mapping table (`terminalPromptHost` → all 4 `promptHost` paths; every other field → its single path). A field with no CMS value (`null`) is simply omitted from the returned partial (not set to `undefined` inside a present parent object — the parent key itself is only present if at least one of its children has a value, so `deepMergePartial` doesn't clobber the preset pack's value for an unrelated sibling).
  - `adaptor/types.ts` — `export type { TVoicePack } from '@blog/config';`.
  - `application/service.ts` — `createVoiceSettingsService()` → `{ v1: { getVoiceOverrides: safeAsync(() => getVoiceOverrides()) } }`.
  - `adaptor/loader.ts` — `getVoiceOverrides(): Promise<TVoicePack>`, cache-tagged `isr('voice-settings')` (same pattern as `theme-settings`'s `isr('theme-settings')`).
- Test: (a) `theme-settings` — existing tests updated to also assert the new `preset` field. (b) `voice-settings` — cases: no `settings_voice` document → `{}` (empty overrides, nothing to merge); document with only `notFoundCommandNotFound` set → returned object has exactly `{ notFound: { commandNotFound: '<value>' } }`, no other keys present; document with `terminalPromptHost` set → returned object has the value at all 4 fan-out paths (`authMenu.promptHost` + all 3 `accountPage.*.promptHost`).

**Interfaces — Consumes:** `TVoicePack` (Task 2); the generated `SettingsVoice` type (Task 4).
**Produces:** `service.global.themeSettings.v1.getTheme()`'s resolved `TThemeTokens` now includes `preset: TPresetId`. `service.global.voiceSettings.v1.getVoiceOverrides(): Promise<Result<TVoicePack>>`.

- [ ] **Step 1 (test-writer, failing tests):** Write the `voice-settings` test cases above against not-yet-implemented `getVoiceOverrides()`, and add the `preset`-field assertion to `theme-settings`'s existing tests.
- [ ] **Step 2:** Run — Expected: FAIL.
- [ ] **Step 3 (service):** Dispatch `service` to add `preset` to `TThemeTokens`/`toThemeTokens`, and implement the `voice-settings` feature per the structure above.
- [ ] **Step 4:** Run the tests — Expected: PASS.
- [ ] **Step 5:** Verify `pnpm --filter @blog/service type-check` + test; commit (`feat(service): fetch voice overrides, resolve active preset alongside theme tokens`).

---

### Task 6: `apps/web` — the `next-intl` overlay merge

**Dispatch:** `web` subagent, then `test-writer`.

**Files:**

- Modify: `apps/web/src/i18n/request.ts` — after loading the locale's `messages` JSON (the now-neutralized base), fetch `service.global.themeSettings.v1.getTheme()` (for `preset`) and `service.global.voiceSettings.v1.getVoiceOverrides()` (for CMS overrides), then:

  ```ts
  const preset = themeResult.ok ? themeResult.data.preset : PRESET_ID.CONSOLE;
  const voicePack = PRESET_REGISTRY[preset].voicePack;
  const voiceOverrides = voiceOverridesResult.ok
    ? voiceOverridesResult.data
    : {};
  const resolvedMessages = deepMergePartial(
    messages,
    voicePack,
    voiceOverrides,
  );
  return { locale, messages: resolvedMessages };
  ```

  (Unwrap each `Result` with an `if`, per this repo's convention — not a ternary — before use; a failed fetch of either falls back to the safe default: `CONSOLE`'s preset id / no overrides, never a thrown error or empty page.)

- Test: `apps/web/src/i18n/request.test.ts` (new) — cases: (a) `CONSOLE` preset, no `settings_voice` document → resolved messages equal today's **original** (pre-neutralization) values at all 64 classification-table paths, proving the full round-trip (neutralized base + console pack = original wording, end-to-end); (b) `EDITORIAL` preset, no `settings_voice` document → resolved messages equal the neutralized base unchanged at those same 64 paths; (c) `CONSOLE` preset + a `settings_voice` document overriding only `notFoundCommandNotFound` → that one path reflects the override, every other of the 63 remaining paths still shows the console pack's value (proves "a CMS override changes one key without affecting others").

**Interfaces — Consumes:** `deepMergePartial` (Task 1), `PRESET_REGISTRY`/`PRESET_ID`/`TVoicePack` (Task 2), `service.global.themeSettings.v1.getTheme()` + `service.global.voiceSettings.v1.getVoiceOverrides()` (Task 5).
**Produces:** the fully working voice ladder, end-to-end.

- [ ] **Step 1 (failing test):** Write the three `request.test.ts` cases above (mock `service.global.themeSettings`/`voiceSettings` per however `theme-settings`'s own consumer tests already mock `@blog/service`, e.g. `apps/web/src/app/layout.test.tsx`'s mocking pattern — reuse it, don't invent a new one).
- [ ] **Step 2:** Run — Expected: FAIL.
- [ ] **Step 3 (web):** Dispatch `web` to implement the merge in `request.ts` per the code above.
- [ ] **Step 4:** Run — Expected: PASS.
- [ ] **Step 5:** Verify `pnpm --filter web type-check` + test.
- [ ] **Step 6:** Commit (`feat(web): resolve voice ladder — neutral base, preset pack, CMS overrides`).

---

### Task 7: Integration verify + review + docs

- [ ] **Step 1:** `verify-runner` (synchronous): `pnpm type-check && pnpm lint && pnpm test` from root — all green.
- [ ] **Step 2:** `reviewer` over the full diff → fix blocking findings → re-run until `APPROVE`.
- [ ] **Step 3:** Manually verify (or have `web` verify) the acceptance criteria empirically: switching `settings_theme.preset` between `CONSOLE`/`EDITORIAL` on a running dev instance visibly changes the affected copy; a single `settings_voice` field edit changes only that string.
- [ ] **Step 4:** Update `SPEC.md` (content model — `settings_voice`; rendering — the voice-ladder merge in `next-intl`'s request config) and `docs/context/content-model.md`.
- [ ] **Step 5 (per user instruction, 2026-08-12):** Delete this plan doc (`docs/superpowers/plans/2026-08-12-phase3-voice-as-content-plan.md`) in the same commit as Step 4's `SPEC.md` sync — its job ends once `SPEC.md` reflects the final shape, same retention rule `CLAUDE.md` applies to the program-level specs/plans.
- [ ] **Step 6:** Commit; **ask to push** (human gate); **ask to open PR** (human gate); on PR → board → `ci-watcher` → sweep worktrees.

**PR split:** Tasks 1–2 (utils + config: Step 0) land as their own standalone PR — the hard gate, reviewed and merged before anything else starts. Task 3 (web: neutralize `en.json`) is a second standalone PR (pure content edit, nothing downstream depends on it compiling against a new type). Tasks 4–6 (cms, service, web merge) land together as a third PR — `service`'s `preset` field addition and the merge wiring are tightly coupled enough that splitting them risks an interim state where `voice-settings` exists but nothing consumes it; per `CLAUDE.md`'s "split only when each layer's PR merges to `main` green on its own," these three are safe to split by layer in principle (each is additive) but are small enough as a set that bundling avoids three tiny review cycles for one coherent feature — implementer's call at execution time whether to split further, state the reasoning either way in the PR body(ies).

## Self-review (plan ↔ spec)

- Step 0 preservation, non-negotiable, gates the rest (D5) → Task 2, with an explicit orchestrator checkpoint (Step 6) before Task 3 starts. ✔
- `console` reproduces today's exact wording / `editorial` renders neutral wording → Task 6's test cases (a)/(b), asserting the full round-trip at all 64 paths, not just spot-checks. ✔
- A CMS override changes one key without affecting others → Task 6's test case (c) + Task 5's fan-out test (isolated single-field CMS doc → exactly one resulting key). ✔
- Voice mechanism: code voice-packs + curated CMS overrides, neutral `en.json` base (D4) → Tasks 2 (packs), 3 (neutral base), 4 (curated CMS fields), 6 (merge). ✔
- CMS voice-override keys per-locale-ready (D10) → satisfied by construction: `settings_voice` is scoped to the single active locale already (this repo is monolingual-EN today, one `settings_voice` singleton per tenant/project); adding a locale dimension later is additive (a second per-locale document or a locale field), no reshaping of the 20 field names needed. Noted, no current-phase work required beyond not baking in an English-only assumption into field _names_ (checked — none of the 20 field names reference "English" or embed locale-specific grammar assumptions).
- `console` is the safety net (D6) → Task 2's completeness test + Task 6's round-trip test are the two enforcement points.
- Migration: none, stated per-task (Task 4's cms schema is additive). ✔
- Chrome composition gating and email templates — explicitly out of scope, each with its own follow-up ticket (see "Explicitly out of scope" in Global Constraints, and the orchestrator's separate board-keeper dispatch after this plan is approved).
- No placeholders: every task names exact files, the exact 64-row classification table, the exact 20 CMS field names + their fan-out mapping, and concrete test cases with real assertions.
