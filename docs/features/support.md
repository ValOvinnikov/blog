---
title: Support
status: built
layers: [platform, email, config]
code:
  - apps/platform/src/app/[locale]/dashboard/(tenant)/help/**
  - apps/platform/src/app/[locale]/tenants/[tenantId]/(detail)/help/**
  - apps/platform/src/components/features/support/**
  - apps/platform/src/server/support/**
  - apps/platform/src/constants/support.ts
  - apps/platform/src/utils/help-nav-section/**
  - packages/email/src/templates/operator/support-request/**
  - packages/email/src/html/email-message-quote/**
epics: [5085]
---

# Support

## What it does

A signed-in member reaches support from the platform without describing which
site they mean. The Help page sends one email to the support inbox carrying the
member's subject and message plus the site, its plan and status, the member's
account and role, and the page they opened Help from. Replying to that email
reaches the member, and the member gets a copy. Nothing is stored.

## Surfaces and routes

- A "Support" section at the foot of the sidebar's nav (and of the topbar menu
  below `md`) with one "Help" entry, for every signed-in member on every plan:
  `/dashboard/help` in the owner's tree and `/tenants/{id}/help` in the
  operator's view of a tenant. The operator's Platform-only pages have no
  tenant and no Help entry.
- The page has a header ("Help", with a "Help centre" link button when
  `HELP_CENTRE_URL` is set) and a "Contact support" card: the answer-time line,
  a Subject field, a Message field and "Send message".
- On success the fields clear and a toast says the message was sent and a copy
  emailed. A refused field keeps the input and says why under it ("Fill this
  in.", "Keep this under {limit} characters."). Too many messages, an
  unavailable form or a failed send keep the input and say so in an error toast.
- With no `SUPPORT_EMAIL_ADDRESS` the card is replaced by a warning that the
  form is unavailable.
- Server Action: `sendSupportMessageAction(tenantId, { subject, message,
originPath })`.

## Data

Nothing is stored. The originating page is the same-site `Referer` of the
request that rendered the Help page (path and query), read on the server and
passed back with the message; it is dropped when absent, on another host, the
Help page itself, or not a path. The email is built by
`buildSupportRequestEmail` (`@shinefold/email`, operator copy, English only)
and sent twice from the operator-alert sender: to the support inbox with the
member as Reply-To, then to the member with the support inbox as Reply-To.

## Configuration

- `SUPPORT_EMAIL_ADDRESS` (optional): the support inbox. Unset → the page says
  the form is unavailable, the action returns `UNAVAILABLE`, and each server
  instance logs `support.address_missing` once.
- `HELP_CENTRE_URL` (optional): the help centre the page links to.
- No plan gating.

## Constraints and invariants

- Subject 1–150 characters and message 1–5,000 after trimming; an empty or
  oversized field is refused before the tenant gate runs or anything is sent.
- At most 5 messages per account per hour, counted in the shared rate-limit
  store (Upstash Redis in production, in memory elsewhere); the sixth is
  `RATE_LIMITED`.
- The action re-checks tenant membership (`requireTenantMembership`); a
  signed-out visitor is sent to sign-in by the layout gate and the action
  alike.
- An operator's role is their admin role, never the virtual OWNER membership.
- A failed send to support is `SERVER_ERROR` and logs `support.send_failed`; a
  failed copy to the member still reports success and logs
  `support.copy_failed`.
- The support email is operator copy and never tenant-editable.

## Dependencies

- `@shinefold/email` (`buildSupportRequestEmail`, `sendEmail`), `@shinefold/db`
  (`getAdminByUserId`), `@shinefold/config` (`ACTION_OUTCOME`).
- Features: [platform-shell](./platform-shell.md),
  [tenant-access](./tenant-access.md),
  [operator-alerts](./operator-alerts.md) (the sender address).

## Entry points

- `apps/platform/src/app/[locale]/dashboard/(tenant)/help/page.tsx`
- `apps/platform/src/app/[locale]/tenants/[tenantId]/(detail)/help/page.tsx`
- `apps/platform/src/server/support/send-support-message-action.ts`
- `apps/platform/src/components/features/support/help-view/help-view.tsx`
- `packages/email/src/templates/operator/support-request/support-request.ts`

## Tests and stories

- `apps/platform/src/server/support/*.test.ts`
- `apps/platform/src/components/features/support/help-view/**/*.test.tsx`
- `packages/email/src/templates/operator/support-request/support-request.test.ts`

## Related epics

- #5085: launch readiness.
