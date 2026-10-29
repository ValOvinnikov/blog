# Action-outcome guards — conversion backlog

Read an action result through `@blog/config`'s outcome guards, never a raw
`result.outcome === ACTION_OUTCOME.<X>` comparison. Each guard takes the whole
result and narrows it, so `isOutcomeInvalid(result) && result.fieldErrors`
type-checks:

- `isOutcomeSuccess`, `isOutcomeInvalid`, `isOutcomeServerError`,
  `isOutcomeRefused` and `isOutcomeUnavailable` exist today
  (`packages/config/src/action-outcome/is-outcome.ts`).
- A guard for another outcome is added only by the change that gives that
  check its second use. `RATE_LIMITED` (one use) and `BLOCKED` (none) stay raw
  comparisons until then.

## Files still comparing raw outcomes

Convert a file when a diff touches it (the steady-state rule), never as a
sweep, and delete its line here in the same change. When the list is empty,
delete this doc, its row in `README.md`, and the sentence pointing here in
`CLAUDE.md`'s "Read an action result through its outcome guards" — the rule
itself stays.

- `apps/platform/src/components/features/blocked-signups/blocked-signups-view/components/add-blocked-domain-card/use-add-blocked-domain.ts` — INVALID, SUCCESS
- `apps/platform/src/components/features/blocked-signups/blocked-signups-view/components/blocked-signups-table/components/remove-blocked-identity-control/remove-blocked-identity-control.tsx` — REFUSED, SUCCESS
- `apps/platform/src/components/features/email/email-settings/components/send-test-email-button/use-send-test-email.ts` — SUCCESS
- `apps/platform/src/components/features/email/email-settings/use-email-draft.ts` — INVALID, SUCCESS
- `apps/platform/src/components/features/leads/leads-inbox/components/lead-reading-pane/components/delete-lead-control/delete-lead-control.tsx` — REFUSED, SUCCESS
- `apps/platform/src/components/features/look/look-form/use-look-save.ts` — SUCCESS
- `apps/platform/src/components/features/releases/releases-view/components/release-card/components/start-release-dialog/start-release-dialog.tsx` — INVALID, SUCCESS
- `apps/platform/src/components/features/releases/releases-view/components/run-contrast-check-button/run-contrast-check-button.tsx` — REFUSED, SUCCESS, UNAVAILABLE
- `apps/platform/src/components/features/studio/owner-studio-access-view/components/owner-access-actions/owner-access-actions.tsx` — SUCCESS
- `apps/platform/src/components/features/tenants/tenant-details-form/use-create-tenant-submit.ts` — INVALID, REFUSED, SERVER_ERROR
- `apps/platform/src/components/features/voice/voice-settings/use-voice-draft.ts` — INVALID
- `apps/platform/src/server/provisioning/delete-tenant-action.ts` — SUCCESS
- `apps/platform/src/server/provisioning/reactivate-tenant-action.ts` — SUCCESS
- `apps/platform/src/utils/staged-image/staged-image.ts` — SUCCESS
- `apps/platform/src/utils/use-form-submission/use-form-submission.ts` — SUCCESS
- `apps/platform/src/utils/use-provisioning-poll/use-provisioning-poll.ts` — REFUSED, SUCCESS
- `apps/platform/src/utils/use-upload-error-text/use-upload-error-text.ts` — REFUSED
- `apps/web/src/components/shared/bookmark-button/bookmark-button.tsx` — SUCCESS, UNAVAILABLE
- `apps/web/src/components/shared/delete-account-control/delete-account-control.tsx` — SUCCESS
- `apps/web/src/components/shared/display-name-control/display-name-control.tsx` — SUCCESS
- `apps/web/src/components/shared/newsletter-form/newsletter-form.tsx` — SUCCESS
- `apps/web/src/components/shared/newsletter-subscription-control/newsletter-subscription-control.tsx` — SUCCESS, UNAVAILABLE
- `apps/web/src/components/shared/provider-link-control/provider-link-control.tsx` — SUCCESS
- `apps/web/src/modules/contact-form/hooks/use-contact-form/use-contact-form.ts` — INVALID, SUCCESS
