# `@blog/db` Email Separation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove outbound email from `@blog/db` entirely — its CLI scripts report an event to `apps/platform` over HTTP, and the platform app decides who to tell and renders the mail.

**Architecture:** A new `POST /api/internal/operator-alert` route on `apps/platform`, authenticated by a Bearer shared secret compared in constant time, mirroring `apps/web`'s existing `/api/revalidate-site-config`. The two `notify-operators.ts` modules in `@blog/db`'s scripts stop constructing Resend clients and HTML, and instead POST a small typed event. Recipient resolution moves to the platform app, so the scripts no longer query superadmins or escape anything. `packages/email` gains its first real consumers.

**Tech Stack:** Next.js 16 App Router route handler, `node:crypto` `timingSafeEqual`, Drizzle/Neon via `@blog/db`, Resend via `@blog/email`, Vitest.

**Spec:** [`../specs/2026-09-03-tenant-email-design.md`](../specs/2026-09-03-tenant-email-design.md) §6

## Global Constraints

- `@blog/db` must end this plan with **no** `resend` dependency and **no** `@blog/email` dependency in `packages/db/package.json`.
- `@blog/email` may import **only** `@blog/utils`. It must not import `@blog/config`, so the alert-kind vocabulary never enters it — the package exports one builder per alert type and the caller chooses.
- `@blog/db`, `@blog/service`, `@blog/auth` and `@blog/email` **never log**. `packages/db/scripts/**` is the exception (`configs/eslint/db.js`) and keeps its existing `console.*` calls.
- The two notify functions **must never throw** — a notification failure must not fail the sweep it reports on. This contract is already documented on both and must survive.
- Conventional commits, lower-case scope. Run `pnpm type-check && pnpm lint && pnpm test && pnpm knip` from the repo root before the final commit.
- Any new env var must be declared in `turbo.json` (strict env mode strips undeclared vars) and pass `pnpm check:turbo-env-sync`.

---

### Task 1: Move `isSecretMatch` into `@blog/utils`

**This primitive is already duplicated — that is the reason for the task, not a risk it avoids.** Both apps carry their own byte-for-byte copy:

- `apps/web/src/utils/is-secret-match/` (with an `index.ts` barrel), consumed by `apps/web/src/app/api/revalidate-site-config/route.ts` and `apps/web/src/app/api/generate-skim/route.ts`
- `apps/platform/src/utils/is-secret-match/` (no barrel), consumed by `apps/platform/src/server/tenants/owner-invite-token.ts`

Each has its own test file. `@blog/utils` is framework-free and already consumed by both apps, so one copy there replaces both. Deleting only the web copy would leave the duplication standing.

**Files:**

- Create: `packages/utils/src/is-secret-match/is-secret-match.ts`
- Create: `packages/utils/src/is-secret-match/index.ts`
- Create: `packages/utils/src/is-secret-match/is-secret-match.test.ts`
- Modify: `packages/utils/src/index.ts` (add the barrel re-export)
- Delete: `apps/web/src/utils/is-secret-match/` (whole directory, including its test)
- Delete: `apps/platform/src/utils/is-secret-match/` (whole directory, including its test)
- Modify: all three importers listed above
- Modify: `apps/platform/package.json` — **add `"@blog/utils": "workspace:*"`**, then run `pnpm install`

**`apps/platform` does not currently depend on `@blog/utils`, and the alias alone will not save you.** Its `tsconfig.json` and `vitest.config.ts` already declare the `@blog/utils/*` wildcard, so the alias looks present — but `isSecretMatch` is consumed as a **bare** root import (`import { isSecretMatch } from '@blog/utils'`, matching every other consumer in the repo — `packages/utils/package.json`'s `exports` map does declare several subpaths such as `./async` and `./color`, but none for `is-secret-match`, and this task adds none). A bare specifier does not match a wildcard-only `paths` entry, so it resolves through `node_modules` — which requires the `package.json` dependency. `@blog/insight` in this same app is the working precedent: wildcard-only alias, bare import, and it works precisely _because_ it is declared in `package.json`.

Skip this and `apps/platform` fails with "Cannot find module '@blog/utils'" at type-check, test and build.

**Interfaces:**

- Produces: `isSecretMatch(provided: string | null, expected: string): boolean`, exported from `@blog/utils`.

- [ ] **Step 1: Find every consumer**

```bash
grep -rn "is-secret-match\|isSecretMatch" apps packages --include="*.ts" --include="*.tsx" --exclude-dir=node_modules
```

Expect at least the three importers and two implementation directories named above. If the grep turns up anything else, it goes in the same sweep — a fourth copy is exactly what this task exists to prevent.

- [ ] **Step 2: Move the implementation verbatim**

The body is copied unchanged from `apps/web/src/utils/is-secret-match/is-secret-match.ts`, which is an **arrow const** — match the file style of its new neighbours in `packages/utils/src/` and convert only if they are declarations.

```ts
import { timingSafeEqual } from 'node:crypto';

/** Constant-time secret comparison — a plain `===` leaks timing information proportional to how many leading characters match. */
export const isSecretMatch = (
  provided: string | null,
  expected: string,
): boolean => {
  if (!provided) return false;

  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  if (providedBuffer.length !== expectedBuffer.length) return false;

  return timingSafeEqual(providedBuffer, expectedBuffer);
};
```

Diff the two app copies against each other before deleting either. They are believed identical; if they have drifted, the differences must be understood rather than silently resolved by picking one.

- [ ] **Step 3: Move the existing test and add the length case**

Copy the existing test file across, then confirm it covers all four cases below — add any that are missing:

```ts
import { describe, expect, it } from 'vitest';

import { isSecretMatch } from './is-secret-match';

describe('isSecretMatch', () => {
  it('returns false for a null provided secret', () => {
    expect(isSecretMatch(null, 'expected')).toBe(false);
  });

  it('returns false for an empty provided secret', () => {
    expect(isSecretMatch('', 'expected')).toBe(false);
  });

  it('returns false when lengths differ', () => {
    expect(isSecretMatch('short', 'a-much-longer-secret')).toBe(false);
  });

  it('returns true for an exact match', () => {
    expect(isSecretMatch('s3cret', 's3cret')).toBe(true);
  });
});
```

- [ ] **Step 4: Run the new test**

Run: `pnpm --filter @blog/utils test`
Expected: PASS.

- [ ] **Step 5: Update consumers and delete the old copy**

Add the `apps/platform` dependency and install:

```bash
pnpm --filter platform add @blog/utils@workspace:*
```

Point all three importers at `@blog/utils`, then delete **both** copies:

```bash
rm -rf apps/web/src/utils/is-secret-match
rm -rf apps/platform/src/utils/is-secret-match
```

- [ ] **Step 6: Verify nothing still points at the old path**

Run: `grep -rn "utils/is-secret-match" apps packages --include="*.ts" --exclude-dir=node_modules`
Expected: no output.

Run: `pnpm --filter @blog/utils type-check && pnpm --filter @blog/utils test`
Run: `pnpm --filter web type-check && pnpm --filter web test`
Run: `pnpm --filter platform type-check && pnpm --filter platform test`
Expected: all PASS.

**`platform` is not optional here.** This task deletes a directory inside `apps/platform` and rewrites one of its importers, so a gate that only checks `web` would pass while leaving that app broken.

- [ ] **Step 7: Commit**

```bash
git add packages/utils apps/web apps/platform pnpm-lock.yaml
git commit -m "refactor(utils): hoist isSecretMatch out of both apps"
```

---

### Task 2: Operator-alert templates in `@blog/email`

Two alert emails exist today as inline HTML inside `@blog/db`'s scripts. They move into `@blog/email` as builders. Copy is preserved **exactly** — this task changes where the HTML is built, not what it says.

**Files:**

- Create: `packages/email/src/templates/operator/owner-elevation-alert.ts`
- Create: `packages/email/src/templates/operator/document-validation-alert.ts`
- Create: `packages/email/src/templates/operator/index.ts`
- Create: `packages/email/src/templates/operator/owner-elevation-alert.test.ts`
- Create: `packages/email/src/templates/operator/document-validation-alert.test.ts`
- Modify: `packages/email/src/index.ts`

**Interfaces:**

- Consumes: `buildEmailShell`, `escapeHtml` from this package. (`buildEmailShell` is renamed to `buildOperatorShell` by the separate tenant-branding plan; it is correct as-is here, because it renders the platform's own look, which is what an operator alert wants.)
- Produces:
  ```ts
  type TOwnerElevationAlertInput = {
    tenantName: string;
    tenantId: string;
    outcome: 'STALLED' | 'AMBIGUOUS_MEMBERSHIP';
  };
  buildOwnerElevationAlertEmail(input: TOwnerElevationAlertInput): {
    subject: string;
    html: string;
  };

  type TDocumentValidationAlertInput = {
    tenantName: string;
    tenantId: string;
    invalidDocumentCount: number;
    isCritical: boolean;
  };
  buildDocumentValidationAlertEmail(input: TDocumentValidationAlertInput): {
    subject: string;
    html: string;
  };
  ```

Note `outcome` is a literal union and `isCritical` a boolean rather than a `TFindingSeverity` — `@blog/email` cannot import `@blog/config`, so the caller narrows.

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest';

import { buildOwnerElevationAlertEmail } from './owner-elevation-alert';

describe('buildOwnerElevationAlertEmail', () => {
  it('escapes the tenant name', () => {
    const { html } = buildOwnerElevationAlertEmail({
      tenantName: '<script>alert(1)</script>',
      tenantId: 'tenant_1',
      outcome: 'STALLED',
    });

    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('names the tenant in the subject', () => {
    const { subject } = buildOwnerElevationAlertEmail({
      tenantName: 'Acme',
      tenantId: 'tenant_1',
      outcome: 'STALLED',
    });

    expect(subject).toBe(
      'Tenant "Acme" (tenant_1) needs owner-elevation attention',
    );
  });

  it('uses distinct copy per outcome', () => {
    const stalled = buildOwnerElevationAlertEmail({
      tenantName: 'Acme',
      tenantId: 'tenant_1',
      outcome: 'STALLED',
    });
    const ambiguous = buildOwnerElevationAlertEmail({
      tenantName: 'Acme',
      tenantId: 'tenant_1',
      outcome: 'AMBIGUOUS_MEMBERSHIP',
    });

    expect(stalled.html).not.toEqual(ambiguous.html);
    expect(stalled.html).toContain("hasn't accepted their Sanity invite");
    expect(ambiguous.html).toContain('more than one human member');
  });
});
```

Write the matching file for `buildDocumentValidationAlertEmail`, asserting: the name is escaped; the subject is exactly `Tenant "Acme" (tenant_1) has invalid Sanity documents`; `isCritical: true` yields "at least one document fails schema validation with an error-level marker" and `false` yields "documents have warning-level schema validation markers"; and the invalid count appears in the body.

- [ ] **Step 2: Run to verify they fail**

Run: `pnpm --filter @blog/email test`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement both builders**

Lift the copy strings verbatim from `packages/db/scripts/recheck-tenant-owners/lib/notify-operators.ts` (its `OUTCOME_COPY` map) and `packages/db/scripts/validate-tenant-documents/lib/notify-operators.ts` (its `severityCopy` ternary). Wrap the body in `buildEmailShell` with `brandName` set to the platform's own name and a `previewText` summarising the alert.

```ts
import { buildEmailShell } from '@blog/email/html/email-shell';
import { escapeHtml } from '@blog/email/html/escape-html';

const OUTCOME_COPY = {
  STALLED:
    "the tenant's owner still hasn't accepted their Sanity invite — administrator grant is stalled.",
  AMBIGUOUS_MEMBERSHIP:
    "the tenant's Sanity project has more than one human member, so it isn't clear which is the owner — no role was granted.",
} as const;

export type TOwnerElevationAlertInput = {
  tenantName: string;
  tenantId: string;
  outcome: keyof typeof OUTCOME_COPY;
};

/** Operator alert for a tenant whose owner elevation needs a human. */
export function buildOwnerElevationAlertEmail({
  tenantName,
  tenantId,
  outcome,
}: TOwnerElevationAlertInput): { subject: string; html: string } {
  const bodyHtml = `<p>Tenant <strong>${escapeHtml(tenantName)}</strong> (id <code>${escapeHtml(tenantId)}</code>) — ${OUTCOME_COPY[outcome]}</p><p>See the tenant's provisioning page in the platform admin panel for detail.</p>`;

  return {
    subject: `Tenant "${tenantName}" (${tenantId}) needs owner-elevation attention`,
    html: buildEmailShell({
      brandName: 'Tenant Alerts',
      previewText: `${tenantName} needs owner-elevation attention`,
      bodyHtml,
    }),
  };
}
```

Note the specifiers point at the **modules**, not at `@blog/email/html`. There is no `src/html/index.ts` barrel, and `packages/email/package.json`'s `exports` map declares only `"."` — so `@blog/email/html` does not resolve. Intra-package imports go through the own-name alias `@blog/email/*` → `./src/*`, never a relative parent path.

- [ ] **Step 4: Run tests**

Run: `pnpm --filter @blog/email test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/email
git commit -m "feat(email): add the two operator-alert templates"
```

---

### Task 3: The platform operator-alert endpoint

**Files:**

- Create: `packages/config/src/constants/operator-alert.ts`
- Modify: `packages/config/src/constants/index.ts`
- Create: `apps/platform/src/app/api/internal/operator-alert/route.ts`
- Create: `apps/platform/src/app/api/internal/operator-alert/route.test.ts`
- Modify: `apps/platform/src/utils/env/env.ts` (add `OPERATOR_ALERT_SECRET`)

**Interfaces:**

- Consumes: `isSecretMatch` (Task 1), both builders (Task 2), `listSuperadminEmails` from `@blog/db/queries/admins`, `sendEmail` from `@blog/email`.
- Produces: the wire contract, in `@blog/config` because **both** `@blog/db` (which sends it) and `apps/platform` (which receives it) must see it, and `db` cannot import an app. Per `CLAUDE.md`'s reach test, two layers across a boundary puts it in `config`; it is not a storage-layer vocabulary.

  ```ts
  export const OPERATOR_ALERT_KIND = {
    OWNER_ELEVATION: 'OWNER_ELEVATION',
    DOCUMENT_VALIDATION: 'DOCUMENT_VALIDATION',
  } as const;

  export type TOperatorAlertKind =
    (typeof OPERATOR_ALERT_KIND)[keyof typeof OPERATOR_ALERT_KIND];

  export type TOperatorAlertBody =
    | {
        kind: typeof OPERATOR_ALERT_KIND.OWNER_ELEVATION;
        tenantId: string;
        outcome: 'STALLED' | 'AMBIGUOUS_MEMBERSHIP';
      }
    | {
        kind: typeof OPERATOR_ALERT_KIND.DOCUMENT_VALIDATION;
        tenantId: string;
        invalidDocumentCount: number;
        isCritical: boolean;
      };
  ```

  Per `feedback_no_tests_for_const_pairs`, the const file itself gets no test — TypeScript covers it.

- Produces: `POST /api/internal/operator-alert` accepting `TOperatorAlertBody`. **The body carries no tenant name and no HTML.** The route looks the tenant up by id, so the script sends facts and the platform owns presentation and escaping.

- [ ] **Step 1: Write the failing tests**

Model the file on an existing route test in the repo for mocking style. Cover:

```ts
it('rejects a request with no Authorization header', async () => {
  const response = await POST(
    new Request('http://localhost/api/internal/operator-alert', {
      method: 'POST',
      body: JSON.stringify({
        kind: 'OWNER_ELEVATION',
        tenantId: 't1',
        outcome: 'STALLED',
      }),
    }),
  );

  expect(response.status).toBe(401);
});
```

Plus: a wrong secret → 401; a secret of a different length → 401 (this is the case a naive `===` would also catch, but it pins the length guard); a malformed body with a valid secret → 400; an unknown `tenantId` → 404 and **no** send; a valid `OWNER_ELEVATION` request → 200 and `sendEmail` called once per superadmin recipient; zero superadmins on file → 200 and `sendEmail` never called; a valid `DOCUMENT_VALIDATION` request → 200 with the document-validation subject.

- [ ] **Step 2: Run to verify they fail**

Run: `pnpm --filter platform test -- operator-alert`
Expected: FAIL — route module not found.

- [ ] **Step 3: Implement the route**

Follow `apps/web/src/app/api/revalidate-site-config/route.ts:67-105` for the guard, exactly:

```ts
export async function POST(request: Request): Promise<NextResponse> {
  const secret = env.OPERATOR_ALERT_SECRET;
  if (!secret) {
    logger.error('operator_alert.secret_missing');
    return NextResponse.json(
      { message: 'Operator alert secret is not configured.' },
      { status: 500 },
    );
  }

  const authHeader = request.headers.get('authorization');
  const providedSecret = authHeader?.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length)
    : null;

  if (!isSecretMatch(providedSecret, secret)) {
    return NextResponse.json(
      { message: 'Invalid or missing secret.' },
      { status: 401 },
    );
  }

  const parsed = OPERATOR_ALERT_SCHEMA.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Malformed alert body.' },
      { status: 400 },
    );
  }

  const tenant = await queries.tenants.getTenantById(parsed.data.tenantId);
  if (!tenant) {
    logger.warn('operator_alert.tenant_not_found', {
      tenantId: parsed.data.tenantId,
    });
    return NextResponse.json({ message: 'Unknown tenant.' }, { status: 404 });
  }

  const recipients = await listSuperadminEmails();
  if (recipients.length === 0) {
    logger.warn('operator_alert.no_recipients', { tenantId: tenant.id });
    return NextResponse.json({ sent: 0 }, { status: 200 });
  }

  const { subject, html } =
    parsed.data.kind === OPERATOR_ALERT_KIND.OWNER_ELEVATION
      ? buildOwnerElevationAlertEmail({
          tenantName: tenant.name,
          tenantId: tenant.id,
          outcome: parsed.data.outcome,
        })
      : buildDocumentValidationAlertEmail({
          tenantName: tenant.name,
          tenantId: tenant.id,
          invalidDocumentCount: parsed.data.invalidDocumentCount,
          isCritical: parsed.data.isCritical,
        });

  await Promise.all(
    recipients.map((to) =>
      sendEmail({ to, from: OPERATOR_ALERT_FROM_ADDRESS, subject, html }),
    ),
  );

  return NextResponse.json({ sent: recipients.length }, { status: 200 });
}
```

`OPERATOR_ALERT_SCHEMA` is a `zod` discriminated union on `kind` (zod is already a catalog dependency), declared above the handler in the same file. `OPERATOR_ALERT_FROM_ADDRESS` is the string `'Tenant Alerts <onboarding@resend.dev>'` lifted verbatim from the two scripts' `DEFAULT_FROM_ADDRESS` — keep the existing fallback rather than inventing a new sender.

Verify `queries.tenants.getTenantById` exists with that exact name before using it; if the repo names it differently, use the real one. Log via the app's shared logger at `@platform/utils/logger/logger` — static, dot-namespaced event names, dynamic values in the context object, never interpolated into the name.

- [ ] **Step 4: Run tests**

Run: `pnpm --filter platform test -- operator-alert`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/platform
git commit -m "feat(platform): add the internal operator-alert endpoint"
```

---

### Task 4: `recheck-tenant-owners` posts instead of sending

**Files:**

- Create: `packages/db/scripts/lib/post-operator-alert.ts` (shared by Tasks 4 and 5)
- Create: `packages/db/scripts/lib/post-operator-alert.test.ts`
- Modify: `packages/db/scripts/recheck-tenant-owners/lib/notify-operators.ts`
- Modify: `packages/db/scripts/recheck-tenant-owners/lib/notify-operators.test.ts`

**Interfaces:**

- Consumes: `TOperatorAlertBody` and `OPERATOR_ALERT_KIND` from `@blog/config/constants` (Task 3). `@blog/db` already depends on `@blog/config`, so no dependency changes.
- Produces: `postOperatorAlert(body: TOperatorAlertBody): Promise<void>` — reads `PLATFORM_APP_URL` and `OPERATOR_ALERT_SECRET`, POSTs, **never throws**.

Note `packages/db/scripts/lib/` is a new directory — every existing script keeps its own private `lib/`, and this is the first module shared across two of them. Confirm `packages/db`'s tsconfig/vitest alias resolves it before writing the test.

- [ ] **Step 1: Write the failing test for the poster**

```ts
it('does not throw when the platform returns 500', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response(null, { status: 500 })),
  );

  await expect(
    postOperatorAlert({
      kind: 'OWNER_ELEVATION',
      tenantId: 't1',
      outcome: 'STALLED',
    }),
  ).resolves.toBeUndefined();
});

it('does not throw when fetch itself rejects', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNRESET')));

  await expect(
    postOperatorAlert({
      kind: 'OWNER_ELEVATION',
      tenantId: 't1',
      outcome: 'STALLED',
    }),
  ).resolves.toBeUndefined();
});

it('sends the secret as a Bearer token', async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValue(new Response(null, { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);

  await postOperatorAlert({
    kind: 'OWNER_ELEVATION',
    tenantId: 't1',
    outcome: 'STALLED',
  });

  const [, init] = fetchMock.mock.calls[0];
  expect(init.headers.Authorization).toMatch(/^Bearer /);
});
```

Add: when either env var is unset it skips, logs once, and does not call `fetch`.

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @blog/db test -- post-operator-alert`
Expected: FAIL.

- [ ] **Step 3: Implement the poster, then rewrite `notify-operators.ts`**

`notifyOperatorsOfOwnerElevationOutcome` keeps its exported name and its never-throws contract, but its `TNotifyOperatorsParams` loses `resendApiKey` and its body becomes a `postOperatorAlert` call. Delete this file's local `escapeHtml`, its `Resend` import, its `DEFAULT_FROM_ADDRESS`, its `OUTCOME_COPY` (now in `@blog/email`), and its `listSuperadminEmails` call — recipient resolution is the platform's job now. Keep `isNotifiableOutcome` and `TNotifiableOutcome` exactly as they are; the caller depends on them.

Then follow `resendApiKey` all the way up and delete it at every level, not just at this boundary: `notify-owner-elevation-outcome.ts`'s own `resendApiKey` param field goes too, and so does the threading in **both** of its callers (`provision-tenant/run.ts` and `recheck-tenant-owners/run.ts`). Type errors will surface most of this, but the env-reading that supplies the value will not error on its own — remove that as well.

- [ ] **Step 4: Run tests**

Run: `pnpm --filter @blog/db test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/db
git commit -m "refactor(db): post owner-elevation alerts to the platform"
```

---

### Task 5: `validate-tenant-documents` posts instead of sending

**Files:**

- Modify: `packages/db/scripts/validate-tenant-documents/lib/notify-operators.ts`
- Modify: `packages/db/scripts/validate-tenant-documents/lib/notify-operators.test.ts`

**Interfaces:**

- Consumes: `postOperatorAlert` from Task 4.

- [ ] **Step 1: Update the test**

`notifyOperatorsOfDocumentValidationFailure` keeps its name; `TNotifyOperatorsParams` loses `resendApiKey`. Assert it calls `postOperatorAlert` with `{ kind: 'DOCUMENT_VALIDATION', tenantId, invalidDocumentCount, isCritical }`, that `isCritical` is `true` only for `FINDING_SEVERITY.CRITICAL`, and that it still resolves rather than throwing when the post fails.

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @blog/db test -- validate-tenant-documents`
Expected: FAIL.

- [ ] **Step 3: Implement**

Delete the local `escapeHtml`, the `Resend` import, `DEFAULT_FROM_ADDRESS`, the `severityCopy` ternary and the `listSuperadminEmails` call. Narrow `severity` to the boolean at this boundary, since `@blog/email` cannot see `TFindingSeverity`.

Update the call site in `validate-tenant-documents/run.ts` to stop passing `resendApiKey`.

- [ ] **Step 4: Run tests**

Run: `pnpm --filter @blog/db test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/db
git commit -m "refactor(db): post document-validation alerts to the platform"
```

---

### Task 6: Drop the dependency and wire the environment

**Files:**

- Modify: `packages/db/package.json` (remove `resend` and `@blog/email`)
- Modify: `knip.json` (remove the now-obsolete `@blog/email` ignore for `packages/db`)
- Modify: `turbo.json` (declare `PLATFORM_APP_URL`, `OPERATOR_ALERT_SECRET`)
- Modify: `.github/workflows/recheck-tenant-owners.yml`
- Modify: `.github/workflows/validate-tenant-documents.yml`
- Modify: `.github/workflows/provision-tenant.yml` (it `workflow_call`s validate-tenant-documents)
- Modify: `docs/context/environment-variables.md`
- Modify: `SPEC.md` §4 and `.claude/agents/email.md`

- [ ] **Step 1: Remove the dependencies**

```bash
pnpm --filter @blog/db remove resend @blog/email
```

- [ ] **Step 2: Prove no Resend reference survives in `db`**

```bash
grep -rn "resend\|Resend" packages/db --include="*.ts" --include="*.json" --exclude-dir=node_modules
```

Expected: no output. If `RESEND_API_KEY` still appears in a script's env reader, remove it there too.

- [ ] **Step 3: Swap the workflow env**

In both workflows, remove `RESEND_API_KEY` from the step env and add `PLATFORM_APP_URL` and `OPERATOR_ALERT_SECRET`. Pass secrets via `env:`, never interpolated into `run:` — the same rule `.github/actions/setup/action.yml` follows for `install-filter`.

- [ ] **Step 4: Update the prose that names `db` as an email sender**

`SPEC.md` §4's `@blog/email` row and `.claude/agents/email.md` both justify the package's "upstream is `utils` only" position by naming `@blog/db`'s CLI scripts as consumers. That is no longer true. Correct both to cite `@blog/auth` (which still consumes the package and sits above `db`) as the binding constraint. Also update `CLAUDE.md`'s carve-out list, which names these scripts as `@blog/insight` importers — that part stays true, so change only the email claim.

- [ ] **Step 5: Full verification**

```bash
pnpm type-check && pnpm lint && pnpm test && pnpm knip && pnpm check:turbo-env-sync
```

Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore(db): drop resend now that alerts route through the platform"
```

---

## Deployment note

`OPERATOR_ALERT_SECRET` must be set on **both** `apps/platform`'s Vercel project and the GitHub Environment the two workflows run under, with the same value, before the first post-deploy sweep. Until it is, `postOperatorAlert` skips and logs — alerts are silently lost rather than erroring, which matches today's behaviour when `RESEND_API_KEY` is unset. That configuration is human-gated console work; it is not part of this plan.

**Accepted risk, recorded in the spec:** these alerts fire when provisioning breaks, and they now depend on the platform app being up. If that coupling ever bites, the fix is a fallback transport inside `postOperatorAlert` — not returning email to `@blog/db`.
