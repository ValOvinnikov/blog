# Phase 8 Epic 2 — Per-Tenant Content Reads (Infrastructure) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give `@blog/service` a per-tenant Sanity client factory with encrypted
per-tenant read tokens and tenant-scoped ISR tags, proven end-to-end through
one real vertical slice (`getPostsByIds` / the bookmarks page) — without
breaking any of the 29 other `service.*` loaders still reading the legacy
single-tenant client.

**Architecture:** `getClient()`/`runQuery()`/`isr()` all gain an **optional**
tenant parameter. Called with no tenant, they behave exactly as today (the
legacy env-configured client, unprefixed tags) — this is what keeps every
unmigrated loader compiling and working unchanged. Called with a
`TTenantSanityContext` (resolved in `web` from the request's `x-tenant-id`
header via a new `@blog/db` query), they read from that tenant's own Sanity
project with that tenant's own decrypted token, and write cache tags prefixed
`t:<projectId>:<tag>`. The revalidation webhook emits **both** the legacy and
`t:<projectId>:`-prefixed tag for every publish (using the `sanity-project-id`
header Sanity sends automatically), so it needs no further changes as more
loaders migrate to tenant-scoped tags over time.

**Tech Stack:** Drizzle ORM + Neon (`@blog/db`), `next-sanity` client + groqd
(`@blog/service`), Next.js 16 Route Handler + `next/cache` (`apps/web`),
Node's `node:crypto` (AES-256-GCM) for token encryption, Vitest + PGlite for
`@blog/db` tests.

**Spec:**
`docs/superpowers/specs/2026-08-07-multi-tenant-architecture-design.md`
(§2 "Content reads — per-tenant Sanity client", §Open decisions 1/2/7 —
all resolved 2026-08-14; read that section before starting).

## Global Constraints

- Layer contracts (`CLAUDE.md`): `@blog/service` never imports `@blog/db` —
  `apps/web` is the only place they meet. `@blog/utils` stays pure/
  framework-free (no env reads, no DB).
- `@blog/db` is the only package importing Drizzle/Neon; `@blog/service` is
  the only package importing the Sanity SDKs.
- No faked defaults — `getTenantSanityCredentials` returns
  `TTenantSanityContext | undefined`, never a partially-filled object.
- Every new/changed `packages/db/src/schema/*.ts` column needs a generated
  migration (`db:generate`) — additive/nullable here, so no backfill step,
  but still human-gated to apply against any shared/prod Neon branch.
- Comments never reference issue numbers as narrative, roadmap phases, or
  spec/plan paths (`CLAUDE.md` "Conventions") — the one exception is a
  `TODO:`/`FIXME:` in its own comment block.
- Key/value consts are UPPERCASE pairs in `@blog/config`, `as const`.
- `pnpm type-check`, `pnpm lint`, `pnpm test` must stay green after every
  task; `pnpm typegen` is not touched by this plan (no Sanity schema change).

---

### Task 1: `@blog/utils` — symmetric secret encryption helper

**Files:**

- Create: `packages/utils/src/encryption/encrypt-secret.ts`
- Create: `packages/utils/src/encryption/encrypt-secret.test.ts`
- Modify: `packages/utils/src/index.ts`

**Interfaces:**

- Produces: `encryptSecret(plaintext: string, keyBase64: string): string`,
  `decryptSecret(encrypted: string, keyBase64: string): string` — both pure,
  no env access. `keyBase64` is a base64-encoded 32-byte AES-256 key, always
  supplied by the caller (Task 3/4 read it from `@blog/db`'s own env).

- [ ] **Step 1: Write the failing tests**

```typescript
// packages/utils/src/encryption/encrypt-secret.test.ts
import { decryptSecret, encryptSecret } from './encrypt-secret';

// 32 random bytes, base64-encoded — a throwaway test key, not a real secret.
const TEST_KEY = 'wF3n9s6q0Zc7yq2z8Xh9mS4h9r0kQnW5R2t8jL1oQxo=';

describe('encryptSecret / decryptSecret', () => {
  it('round-trips a plaintext secret', () => {
    const encrypted = encryptSecret('sk-test-token-value', TEST_KEY);

    expect(encrypted).not.toContain('sk-test-token-value');
    expect(decryptSecret(encrypted, TEST_KEY)).toBe('sk-test-token-value');
  });

  it('produces a different ciphertext for the same plaintext on each call', () => {
    const first = encryptSecret('same-value', TEST_KEY);
    const second = encryptSecret('same-value', TEST_KEY);

    expect(first).not.toBe(second);
    expect(decryptSecret(first, TEST_KEY)).toBe('same-value');
    expect(decryptSecret(second, TEST_KEY)).toBe('same-value');
  });

  it('rejects decryption with the wrong key', () => {
    const encrypted = encryptSecret('sk-test-token-value', TEST_KEY);
    const wrongKey = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa=';

    expect(() => decryptSecret(encrypted, wrongKey)).toThrow();
  });

  it('rejects a malformed encrypted value', () => {
    expect(() => decryptSecret('not-a-valid-payload', TEST_KEY)).toThrow(
      'Malformed encrypted secret.',
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @blog/utils test encrypt-secret -- --run`
Expected: FAIL with "Cannot find module './encrypt-secret'"

- [ ] **Step 3: Write the implementation**

```typescript
// packages/utils/src/encryption/encrypt-secret.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
// 96-bit IV is the AES-GCM-recommended length (NIST SP 800-38D).
const IV_LENGTH = 12;

/**
 * Encrypts `plaintext` with a 32-byte AES-256-GCM key (base64-encoded).
 * Returns `iv.authTag.ciphertext`, each segment base64url — safe to store
 * as a single text column value. A fresh random IV each call means the
 * same plaintext never produces the same ciphertext twice.
 */
export function encryptSecret(plaintext: string, keyBase64: string): string {
  const key = Buffer.from(keyBase64, 'base64');
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [iv, authTag, ciphertext]
    .map((buffer) => buffer.toString('base64url'))
    .join('.');
}

/** Inverse of {@link encryptSecret}. Throws on a wrong key or malformed input — GCM's auth tag makes tampering/corruption detectable, not silently wrong. */
export function decryptSecret(encrypted: string, keyBase64: string): string {
  const key = Buffer.from(keyBase64, 'base64');
  const [ivB64, authTagB64, ciphertextB64] = encrypted.split('.');
  if (!ivB64 || !authTagB64 || !ciphertextB64) {
    throw new Error('Malformed encrypted secret.');
  }

  const decipher = createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(ivB64, 'base64url'),
  );
  decipher.setAuthTag(Buffer.from(authTagB64, 'base64url'));

  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextB64, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}
```

- [ ] **Step 4: Export from the package barrel**

```typescript
// packages/utils/src/index.ts — add alongside the existing exports
export * from './encryption';
```

Create `packages/utils/src/encryption/index.ts`:

```typescript
export * from './encrypt-secret';
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm --filter @blog/utils test -- --run`
Expected: PASS, all `@blog/utils` tests green

- [ ] **Step 6: Commit**

```bash
git add packages/utils/src/encryption packages/utils/src/index.ts
git commit -m "feat(utils): add AES-256-GCM secret encryption helper"
```

---

### Task 2: `@blog/db` — encrypted token column + encryption-key env var

**Files:**

- Modify: `packages/db/src/schema/tenants.ts`
- Modify: `packages/db/src/utils/env/env.ts`
- Generated: `packages/db/migrations/00XX_*.sql` (via `db:generate`, name
  chosen by drizzle-kit)
- Orchestrator-owned (not a subagent dispatch — `docs/**` is
  orchestrator scope per `CLAUDE.md`): add `TENANT_TOKEN_ENCRYPTION_KEY` to
  `docs/DEPLOY.md`'s env var table.

**Interfaces:**

- Consumes: nothing new.
- Produces: `tenants.sanityReadTokenEncrypted: string | null` on `TTenant`
  (nullable — existing rows keep working with no backfill); `env` in
  `packages/db/src/utils/env/env.ts` gains `TENANT_TOKEN_ENCRYPTION_KEY`.

- [ ] **Step 1: Add the column**

```typescript
// packages/db/src/schema/tenants.ts — add inside the `tenants` pgTable(...) call,
// after `sanityDataset`:
  // Sanity read token for this tenant's project, AES-256-GCM encrypted
  // (`@blog/utils`'s encryptSecret) with TENANT_TOKEN_ENCRYPTION_KEY.
  // Nullable: a tenant provisioned before this column existed, or one still
  // being set up, has no token yet — @blog/service's client factory falls
  // back to the legacy single-tenant client until it's set.
  sanityReadTokenEncrypted: text('sanity_read_token_encrypted'),
```

- [ ] **Step 2: Add the encryption-key env var**

```typescript
// packages/db/src/utils/env/env.ts — add to the `server` object:
    // Decrypts tenants.sanityReadTokenEncrypted (@blog/utils's
    // encryptSecret/decryptSecret). A 32-byte key, base64-encoded — generate
    // with `openssl rand -base64 32`. Optional: absent, the encrypted-token
    // queries throw rather than silently returning plaintext-adjacent data.
    TENANT_TOKEN_ENCRYPTION_KEY: z.string().min(1).optional(),
```

- [ ] **Step 3: Generate the migration**

Run: `pnpm --filter @blog/db db:generate`
Expected: a new `packages/db/migrations/00XX_*.sql` containing exactly
`ALTER TABLE "tenants" ADD COLUMN "sanity_read_token_encrypted" text;` (plus
the matching `meta/_journal.json`/`00XX_snapshot.json` entries) — additive,
nullable, no data touched. If the diff includes anything else, re-run
`db:generate` per `CLAUDE.md`'s typegen-nondeterminism note until it's
minimal.

- [ ] **Step 4: Apply locally and verify**

Run: `pnpm --filter @blog/db db:migrate` (against your local/dev Neon branch
— never the shared/production branch by hand, per `CLAUDE.md`)
Expected: migration applies cleanly; `SELECT sanity_read_token_encrypted FROM
tenants;` returns `NULL` for existing rows.

- [ ] **Step 5: Update `docs/DEPLOY.md`'s env var table (orchestrator does
      this directly)**

Add a row for `TENANT_TOKEN_ENCRYPTION_KEY` alongside the other server
secrets, generated once per environment via `openssl rand -base64 32` (dev
and prod get **different** keys — rotating later means re-encrypting every
tenant's token, so note that cost inline).

- [ ] **Step 6: Commit**

```bash
git add packages/db/src/schema/tenants.ts packages/db/src/utils/env/env.ts \
  packages/db/migrations docs/DEPLOY.md
git commit -m "feat(db): add encrypted sanity read token column to tenants"
```

---

### Task 3: `@blog/db` — `setTenantSanityToken` mutation

**Files:**

- Create: `packages/db/src/queries/tenants/set-tenant-sanity-token/set-tenant-sanity-token.ts`
- Create: `packages/db/src/queries/tenants/set-tenant-sanity-token/set-tenant-sanity-token.test.ts`
- Modify: `packages/db/src/queries/tenants/index.ts`

**Interfaces:**

- Consumes: `encryptSecret` from `@blog/utils`; `env` from
  `@blog/db/utils/env/env` (Task 2).
- Produces: `setTenantSanityToken(tenantId: string, plaintextToken: string):
Promise<void>` — throws if `TENANT_TOKEN_ENCRYPTION_KEY` is unset.

- [ ] **Step 1: Write the failing test**

```typescript
// packages/db/src/queries/tenants/set-tenant-sanity-token/set-tenant-sanity-token.test.ts
import { TENANT_PLAN, TENANT_STATUS } from '@blog/config/constants';
import { createTenant } from '@blog/db/queries/tenants/create-tenant';
import * as schema from '@blog/db/schema';
import { tenants } from '@blog/db/schema/tenants';
import { createTestDb } from '@blog/db/testing/create-test-db';
import { eq } from 'drizzle-orm';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { setTenantSanityToken } from './set-tenant-sanity-token';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

let db: PgliteDatabase<typeof schema>;
const originalKey = process.env['TENANT_TOKEN_ENCRYPTION_KEY'];

beforeAll(async () => {
  db = await createTestDb();
}, 30_000);

beforeEach(() => {
  getDbMock.mockReturnValue(db);
  process.env['TENANT_TOKEN_ENCRYPTION_KEY'] =
    'wF3n9s6q0Zc7yq2z8Xh9mS4h9r0kQnW5R2t8jL1oQxo=';
});

afterEach(async () => {
  await db.delete(schema.tenants);
  if (originalKey === undefined) {
    delete process.env['TENANT_TOKEN_ENCRYPTION_KEY'];
  } else {
    process.env['TENANT_TOKEN_ENCRYPTION_KEY'] = originalKey;
  }
});

describe(setTenantSanityToken, () => {
  it('stores the token encrypted, not as plaintext', async () => {
    const tenant = await createTenant({
      slug: 'acme',
      primaryDomain: 'acme.example.com',
      sanityProjectId: 'abc123',
      sanityDataset: 'production',
      locale: 'en',
      plan: TENANT_PLAN.FREE,
      status: TENANT_STATUS.ACTIVE,
    });

    await setTenantSanityToken(tenant.id, 'sk-real-token-value');

    const [row] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenant.id));

    expect(row?.sanityReadTokenEncrypted).not.toContain('sk-real-token-value');
    expect(row?.sanityReadTokenEncrypted).toEqual(expect.any(String));
  });

  it('throws when the encryption key is not configured', async () => {
    delete process.env['TENANT_TOKEN_ENCRYPTION_KEY'];
    const tenant = await createTenant({
      slug: 'acme',
      primaryDomain: 'acme.example.com',
      sanityProjectId: 'abc123',
      sanityDataset: 'production',
      locale: 'en',
      plan: TENANT_PLAN.FREE,
      status: TENANT_STATUS.ACTIVE,
    });

    await expect(
      setTenantSanityToken(tenant.id, 'sk-real-token-value'),
    ).rejects.toThrow('TENANT_TOKEN_ENCRYPTION_KEY is not configured.');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @blog/db test set-tenant-sanity-token -- --run`
Expected: FAIL with "Cannot find module './set-tenant-sanity-token'"

- [ ] **Step 3: Write the implementation**

```typescript
// packages/db/src/queries/tenants/set-tenant-sanity-token/set-tenant-sanity-token.ts
import { getDb } from '@blog/db/client';
import { tenants } from '@blog/db/schema/tenants';
import { env } from '@blog/db/utils/env/env';
import { encryptSecret } from '@blog/utils';
import { eq } from 'drizzle-orm';

export async function setTenantSanityToken(
  tenantId: string,
  plaintextToken: string,
): Promise<void> {
  if (!env.TENANT_TOKEN_ENCRYPTION_KEY) {
    throw new Error('TENANT_TOKEN_ENCRYPTION_KEY is not configured.');
  }

  const db = getDb();
  const encrypted = encryptSecret(
    plaintextToken,
    env.TENANT_TOKEN_ENCRYPTION_KEY,
  );

  await db
    .update(tenants)
    .set({ sanityReadTokenEncrypted: encrypted })
    .where(eq(tenants.id, tenantId));
}
```

- [ ] **Step 4: Export from the barrel**

```typescript
// packages/db/src/queries/tenants/index.ts — add:
export * from './set-tenant-sanity-token';
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @blog/db test set-tenant-sanity-token -- --run`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/db/src/queries/tenants/set-tenant-sanity-token \
  packages/db/src/queries/tenants/index.ts
git commit -m "feat(db): add setTenantSanityToken mutation"
```

---

### Task 4: `@blog/db` — `getTenantSanityCredentials` query

**Files:**

- Create: `packages/db/src/queries/tenants/get-tenant-sanity-credentials/get-tenant-sanity-credentials.ts`
- Create: `packages/db/src/queries/tenants/get-tenant-sanity-credentials/get-tenant-sanity-credentials.test.ts`
- Modify: `packages/db/src/queries/tenants/index.ts`

**Interfaces:**

- Consumes: `decryptSecret` from `@blog/utils`; `getTenantById`-equivalent
  row read (this task adds the lookup inline — there is no existing
  `getTenantById`, only `getTenantBySlug`/`listTenants`/`listTenantsByIds`).
- Produces: `type TTenantSanityCredentials = { projectId: string; dataset:
string; token: string }`; `getTenantSanityCredentials(tenantId: string):
Promise<TTenantSanityCredentials | undefined>` — `undefined` when the
  tenant doesn't exist **or** has no token set yet (both are "nothing to
  read," never a faked/partial object).

- [ ] **Step 1: Write the failing test**

```typescript
// packages/db/src/queries/tenants/get-tenant-sanity-credentials/get-tenant-sanity-credentials.test.ts
import { TENANT_PLAN, TENANT_STATUS } from '@blog/config/constants';
import { createTenant } from '@blog/db/queries/tenants/create-tenant';
import { setTenantSanityToken } from '@blog/db/queries/tenants/set-tenant-sanity-token';
import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { getTenantSanityCredentials } from './get-tenant-sanity-credentials';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

let db: PgliteDatabase<typeof schema>;
const originalKey = process.env['TENANT_TOKEN_ENCRYPTION_KEY'];

beforeAll(async () => {
  db = await createTestDb();
}, 30_000);

beforeEach(() => {
  getDbMock.mockReturnValue(db);
  process.env['TENANT_TOKEN_ENCRYPTION_KEY'] =
    'wF3n9s6q0Zc7yq2z8Xh9mS4h9r0kQnW5R2t8jL1oQxo=';
});

afterEach(async () => {
  await db.delete(schema.tenants);
  if (originalKey === undefined) {
    delete process.env['TENANT_TOKEN_ENCRYPTION_KEY'];
  } else {
    process.env['TENANT_TOKEN_ENCRYPTION_KEY'] = originalKey;
  }
});

describe(getTenantSanityCredentials, () => {
  it('resolves the decrypted token alongside project/dataset', async () => {
    const tenant = await createTenant({
      slug: 'acme',
      primaryDomain: 'acme.example.com',
      sanityProjectId: 'abc123',
      sanityDataset: 'production',
      locale: 'en',
      plan: TENANT_PLAN.FREE,
      status: TENANT_STATUS.ACTIVE,
    });
    await setTenantSanityToken(tenant.id, 'sk-real-token-value');

    const credentials = await getTenantSanityCredentials(tenant.id);

    expect(credentials).toEqual({
      projectId: 'abc123',
      dataset: 'production',
      token: 'sk-real-token-value',
    });
  });

  it('resolves undefined when the tenant has no token set yet', async () => {
    const tenant = await createTenant({
      slug: 'acme',
      primaryDomain: 'acme.example.com',
      sanityProjectId: 'abc123',
      sanityDataset: 'production',
      locale: 'en',
      plan: TENANT_PLAN.FREE,
      status: TENANT_STATUS.ACTIVE,
    });

    await expect(
      getTenantSanityCredentials(tenant.id),
    ).resolves.toBeUndefined();
  });

  it('resolves undefined for an unknown tenant id', async () => {
    await expect(
      getTenantSanityCredentials('00000000-0000-0000-0000-000000000000'),
    ).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @blog/db test get-tenant-sanity-credentials -- --run`
Expected: FAIL with "Cannot find module './get-tenant-sanity-credentials'"

- [ ] **Step 3: Write the implementation**

```typescript
// packages/db/src/queries/tenants/get-tenant-sanity-credentials/get-tenant-sanity-credentials.ts
import { getDb } from '@blog/db/client';
import { tenants } from '@blog/db/schema/tenants';
import { env } from '@blog/db/utils/env/env';
import { decryptSecret } from '@blog/utils';
import { eq } from 'drizzle-orm';

export type TTenantSanityCredentials = {
  projectId: string;
  dataset: string;
  token: string;
};

export async function getTenantSanityCredentials(
  tenantId: string,
): Promise<TTenantSanityCredentials | undefined> {
  const db = getDb();

  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId));

  if (!tenant?.sanityReadTokenEncrypted) return undefined;

  if (!env.TENANT_TOKEN_ENCRYPTION_KEY) {
    throw new Error('TENANT_TOKEN_ENCRYPTION_KEY is not configured.');
  }

  return {
    projectId: tenant.sanityProjectId,
    dataset: tenant.sanityDataset,
    token: decryptSecret(
      tenant.sanityReadTokenEncrypted,
      env.TENANT_TOKEN_ENCRYPTION_KEY,
    ),
  };
}
```

- [ ] **Step 4: Export from the barrel**

```typescript
// packages/db/src/queries/tenants/index.ts — add:
export * from './get-tenant-sanity-credentials';
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @blog/db test get-tenant-sanity-credentials -- --run`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/db/src/queries/tenants/get-tenant-sanity-credentials \
  packages/db/src/queries/tenants/index.ts
git commit -m "feat(db): add getTenantSanityCredentials query"
```

---

### Task 5: wire `seed-tenant.ts` with `--sanity-read-token`

**Files:**

- Modify: `packages/db/scripts/seed-tenant.ts`

**Interfaces:**

- Consumes: `setTenantSanityToken` from Task 3.
- Produces: nothing new exported — this is a CLI script.

- [ ] **Step 1: Add the flag to the parsed-args shape and parser**

In `packages/db/scripts/seed-tenant.ts`, add `sanityReadToken?: string` to
`TParsedArgs`, and parse `--sanity-read-token=<value>` the same way the
existing `--sanity-project-id`/`--sanity-dataset` flags are parsed (mirror
their exact parsing code — this plan doesn't re-derive the flag-parsing loop
since it's a direct copy of an existing pattern in the same file).

- [ ] **Step 2: Call `setTenantSanityToken` after the tenant is created/found**

After the existing `createTenant`/`getTenantBySlug` idempotent-upsert logic
resolves a `tenant` row, add:

```typescript
if (args.sanityReadToken) {
  await setTenantSanityToken(tenant.id, args.sanityReadToken);
}
```

Import `setTenantSanityToken` from `@blog/db/queries/tenants` at the top of
the file alongside the existing `createTenant, getTenantBySlug` import.

- [ ] **Step 3: Update the script's own doc-comment usage example**

Add `[--sanity-read-token=<token>]` to the bracketed-optional-flags line in
the file's top doc comment, next to `[--domain=extra.example.com ...]`.

- [ ] **Step 4: Type-check**

Run: `pnpm --filter @blog/db type-check`
Expected: PASS, no errors

- [ ] **Step 5: Commit**

```bash
git add packages/db/scripts/seed-tenant.ts
git commit -m "feat(db): wire seed-tenant.ts to set the tenant's Sanity read token"
```

---

### Task 6: `@blog/service` — per-tenant client factory with LRU

**Files:**

- Modify: `packages/service/src/sanity/client.ts`
- Modify: `packages/service/src/sanity/client.test.ts`

**Interfaces:**

- Produces: `type TTenantSanityContext = { projectId: string; dataset:
string; token: string }`; `getClient(tenant?: TTenantSanityContext):
TSanityClient` — no-arg call preserves today's exact singleton behavior
  (legacy env-configured client); called with `tenant`, returns (and LRU-
  caches, max 20) a client scoped to that project/dataset/token.

- [ ] **Step 1: Write the failing test**

```typescript
// packages/service/src/sanity/client.test.ts — add inside the existing
// `describe('Sanity client module loading', ...)` block, after the existing
// "creates the client with the Sanity CDN disabled" test:

it('creates a per-tenant client when a tenant context is passed', async () => {
  process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'] = 'test-project';
  vi.resetModules();

  const createClientMock = vi.fn().mockReturnValue({});
  vi.doMock('next-sanity', () => ({ createClient: createClientMock }));

  const { getClient } = await import('./client');
  getClient({ projectId: 'tenant-a', dataset: 'production', token: 'tok-a' });

  expect(createClientMock).toHaveBeenCalledWith(
    expect.objectContaining({
      projectId: 'tenant-a',
      dataset: 'production',
      token: 'tok-a',
      useCdn: false,
    }),
  );

  vi.doUnmock('next-sanity');
});

it('reuses a cached client for the same tenant instead of recreating it', async () => {
  process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'] = 'test-project';
  vi.resetModules();

  const createClientMock = vi.fn().mockReturnValue({});
  vi.doMock('next-sanity', () => ({ createClient: createClientMock }));

  const { getClient } = await import('./client');
  const tenant = {
    projectId: 'tenant-a',
    dataset: 'production',
    token: 'tok-a',
  };
  const first = getClient(tenant);
  const second = getClient(tenant);

  expect(first).toBe(second);
  expect(createClientMock).toHaveBeenCalledTimes(1);

  vi.doUnmock('next-sanity');
});

it('does not share the legacy no-arg client with a per-tenant client', async () => {
  process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'] = 'test-project';
  vi.resetModules();

  const createClientMock = vi.fn().mockReturnValue({});
  vi.doMock('next-sanity', () => ({ createClient: createClientMock }));

  const { getClient } = await import('./client');
  getClient();
  getClient({ projectId: 'tenant-a', dataset: 'production', token: 'tok-a' });

  expect(createClientMock).toHaveBeenCalledTimes(2);

  vi.doUnmock('next-sanity');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @blog/service test sanity/client -- --run`
Expected: FAIL — `getClient` doesn't accept an argument yet, `createClient`
called with the legacy shape regardless.

- [ ] **Step 3: Write the implementation**

```typescript
// packages/service/src/sanity/client.ts — replace the whole file
import 'server-only';

import { env } from '@blog/service/utils/env/env';
import { createClient } from 'next-sanity';

type TSanityClient = ReturnType<typeof createClient>;

export type TTenantSanityContext = {
  projectId: string;
  dataset: string;
  token: string;
};

const API_VERSION = '2024-01-01';
// Next's tagged data cache is the caching layer (webhook-driven
// revalidation). Reading through Sanity's CDN on top of it lets a
// just-purged tag refetch a still-stale CDN response and re-cache it
// for up to an hour — origin reads stay rare because ISR absorbs them.
const USE_CDN = false;

let legacyClient: TSanityClient | undefined;

// Small LRU (insertion-order Map: re-set moves an entry to the end) —
// sized for "tens of tenants" per the multi-tenant design's target scale,
// not meant to hold every tenant that has ever existed.
const MAX_CACHED_TENANT_CLIENTS = 20;
const tenantClients = new Map<string, TSanityClient>();

function tenantClientKey(tenant: TTenantSanityContext): string {
  return `${tenant.projectId}:${tenant.dataset}`;
}

/**
 * No-arg call returns the legacy single-tenant client (env-configured) —
 * unchanged behavior for every `service.*` loader not yet migrated to
 * per-tenant context. Called with a `TTenantSanityContext`, returns (and
 * LRU-caches) a client scoped to that tenant's own project/dataset/token.
 */
export function getClient(tenant?: TTenantSanityContext): TSanityClient {
  if (!tenant) {
    if (legacyClient) return legacyClient;

    legacyClient = createClient({
      projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
      dataset: env.NEXT_PUBLIC_SANITY_DATASET,
      apiVersion: API_VERSION,
      useCdn: USE_CDN,
      token: env.SANITY_API_READ_TOKEN,
      perspective: 'published',
    });

    return legacyClient;
  }

  const key = tenantClientKey(tenant);
  const cached = tenantClients.get(key);
  if (cached) {
    // Re-inserting moves the key to the Map's end — the LRU's
    // most-recently-used position — without creating a new client.
    tenantClients.delete(key);
    tenantClients.set(key, cached);
    return cached;
  }

  const client = createClient({
    projectId: tenant.projectId,
    dataset: tenant.dataset,
    apiVersion: API_VERSION,
    useCdn: USE_CDN,
    token: tenant.token,
    perspective: 'published',
  });

  tenantClients.set(key, client);
  if (tenantClients.size > MAX_CACHED_TENANT_CLIENTS) {
    const oldestKey = tenantClients.keys().next().value;
    if (oldestKey !== undefined) tenantClients.delete(oldestKey);
  }

  return client;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @blog/service test sanity/client -- --run`
Expected: PASS, all `client.test.ts` cases green

- [ ] **Step 5: Commit**

```bash
git add packages/service/src/sanity/client.ts packages/service/src/sanity/client.test.ts
git commit -m "feat(service): per-tenant Sanity client factory with LRU cache"
```

---

### Task 7: `@blog/service` — tenant-scoped `runQuery`/`isr`

**Files:**

- Modify: `packages/service/src/sanity/query.ts`
- Modify: `packages/service/src/sanity/query.test.ts`

**Interfaces:**

- Consumes: `TTenantSanityContext`, `getClient` from Task 6.
- Produces: `runQuery` gains an optional `tenant` option;
  `isr(tag: string | string[], scopeProjectId?: string): TNextFetchOptions` —
  no-arg-`scopeProjectId` call keeps producing today's unprefixed tags;
  passed a `projectId`, prefixes every tag `t:<projectId>:<tag>`.

- [ ] **Step 1: Write the failing tests**

```typescript
// packages/service/src/sanity/query.test.ts — add below the existing describe(runQuery, ...) block
import { isr } from './query';

describe(isr, () => {
  it('leaves tags unprefixed with no project id', () => {
    expect(isr(['posts', 'author'])).toEqual({
      next: { revalidate: 3600, tags: ['posts', 'author'] },
    });
  });

  it('prefixes every tag with t:<projectId>: when a project id is given', () => {
    expect(isr(['posts', 'author'], 'tenant-a')).toEqual({
      next: {
        revalidate: 3600,
        tags: ['t:tenant-a:posts', 't:tenant-a:author'],
      },
    });
  });

  it('accepts a single tag string the same as an array of one', () => {
    expect(isr('posts', 'tenant-a')).toEqual({
      next: { revalidate: 3600, tags: ['t:tenant-a:posts'] },
    });
  });
});

describe('runQuery tenant threading', () => {
  it('passes the tenant context through to getClient', async () => {
    mockFetch.mockResolvedValue(null);
    const tenant = {
      projectId: 'tenant-a',
      dataset: 'production',
      token: 'tok',
    };

    const query = q.star.filterByType('blog_post').slice(0);
    await runQuery(query, { tenant }).catch(() => {
      // The slice(0)+notNull edge case from the test above doesn't apply
      // here (no .notNull() fragment); a null fetch resolves to null, not a
      // throw, for this unprojected query — this test only cares that
      // `getClient` (mocked via vi.mock('./client', ...) below) is called
      // with the tenant argument, not with the query's result shape.
    });

    expect(getClientMock).toHaveBeenCalledWith(tenant);
  });
});
```

Update the file's top-level mock to also export a spy for `getClient`:

```typescript
// packages/service/src/sanity/query.test.ts — replace the existing
// `vi.mock('./client', ...)` line with:
vi.mock('./client', () => ({ getClient: getClientMock }));

const mockFetch = vi.fn();
const getClientMock = vi.fn(() => ({ fetch: mockFetch }));
```

(Vitest hoists `vi.mock` calls, but the factory itself runs lazily on first
call — referencing `getClientMock`/`mockFetch` declared below the `vi.mock`
call is safe here because neither is read until a test actually invokes
`runQuery`, by which point both are initialized. This matches the existing
file's own `mockFetch` declared after its `vi.mock` call.)

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @blog/service test sanity/query -- --run`
Expected: FAIL — `isr` doesn't accept a second argument, `runQuery` doesn't
forward `tenant` to `getClient`.

- [ ] **Step 3: Write the implementation**

```typescript
// packages/service/src/sanity/query.ts — full replacement
import type {
  AllSanitySchemaTypes,
  internalGroqTypeReferenceTo,
} from '@blog/config';
import { createGroqBuilder, makeSafeQueryRunner } from 'groqd';

import { getClient, type TTenantSanityContext } from './client';

type TSchemaConfig = {
  schemaTypes: AllSanitySchemaTypes;
  referenceSymbol: typeof internalGroqTypeReferenceTo;
};

export const q = createGroqBuilder<TSchemaConfig>();

/** Shared `.parameters<T>()` shape for the slug-lookup queries (post, category, author, generic page). */
export type TSlugParams = { slug: string };

type TNextFetchOptions = {
  next?: { revalidate?: number | false; tags?: string[] };
  tenant?: TTenantSanityContext;
};

export const runQuery = makeSafeQueryRunner<TNextFetchOptions>(
  (query, { parameters, next, tenant }) =>
    getClient(tenant).fetch(
      query,
      parameters ?? {},
      next ? { next } : undefined,
    ),
);

/**
 * Tag-scope contract: a loader's `isr(...)` call must cover every document
 * `_type` its query can read, not just the `_type` the query is filtered on.
 * If a query's fragment `.deref()`s another document (a post's `author`/
 * `category`, a `link`'s `internalReference`, …), the loader's tags must
 * include that dereferenced type's tag too — resolve the exact tag string
 * from `REVALIDATE_TAGS` in `apps/web/src/utils/revalidate-tags.ts` (the
 * webhook's source of truth for `_type` → tag), never invent a new one. This
 * is a defensive completeness rule for the tag scheme itself — it does not
 * replace or depend on the webhook's blanket `revalidatePath('/', 'layout')`
 * backstop, which stays regardless.
 *
 * No-arg `scopeProjectId` keeps producing the legacy unprefixed tags (every
 * loader not yet migrated to per-tenant context). Passed a `projectId`,
 * every tag is prefixed `t:<projectId>:<tag>` — the revalidation webhook
 * (`apps/web/src/app/api/revalidate/route.ts`) purges both forms on every
 * publish, so this is forward-compatible with loaders migrating one at a
 * time, no webhook change required per loader.
 */
export const isr = (
  tag: string | string[],
  scopeProjectId?: string,
): TNextFetchOptions => {
  const tags = Array.isArray(tag) ? tag : [tag];

  return {
    next: {
      revalidate: 3600,
      tags: scopeProjectId ? tags.map((t) => `t:${scopeProjectId}:${t}`) : tags,
    },
  };
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @blog/service test sanity/query -- --run`
Expected: PASS

- [ ] **Step 5: Run the full `@blog/service` suite — confirm no unmigrated loader broke**

Run: `pnpm --filter @blog/service test -- --run`
Expected: PASS — every other loader still calls `isr(tag)`/`runQuery(query,
{ parameters, next })` with no `tenant`/`scopeProjectId`, so their tags and
client stay exactly as before.

- [ ] **Step 6: Commit**

```bash
git add packages/service/src/sanity/query.ts packages/service/src/sanity/query.test.ts
git commit -m "feat(service): tenant-scoped runQuery/isr, optional and backward-compatible"
```

---

### Task 8: migrate `getPostsByIds` to accept tenant context (worked example)

**Files:**

- Modify: `packages/service/src/features/entities/posts/adaptor/loader.ts`
- Modify: `packages/service/src/features/entities/posts/adaptor/loader.test.ts`
- Modify: `packages/service/src/features/entities/posts/application/service.ts`
- Modify: `packages/service/src/features/entities/posts/application/service.test.ts`

**Interfaces:**

- Consumes: `TTenantSanityContext` from Task 6.
- Produces: `getPostsByIds(ids: string[], tenant?: TTenantSanityContext):
Promise<TPostCard[]>`; `createPostsService()`'s `v1.getPostsByIds` gains
  the same optional second parameter, threaded straight through.

- [ ] **Step 1: Write the failing test (loader)**

```typescript
// packages/service/src/features/entities/posts/adaptor/loader.test.ts — add
// after the existing "tags the query with posts/author/category" test:

it('threads tenant context into runQuery and scopes the tags to it', async () => {
  mockRun.mockResolvedValue([]);
  const tenant = { projectId: 'tenant-a', dataset: 'production', token: 'tok' };

  await getPostsByIds(['a'], tenant);

  expect(mockRun).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({
      tenant,
      next: {
        revalidate: 3600,
        tags: ['t:tenant-a:posts', 't:tenant-a:author', 't:tenant-a:category'],
      },
    }),
  );
});

it('omits tenant scoping when no tenant is given (legacy behavior unchanged)', async () => {
  mockRun.mockResolvedValue([]);

  await getPostsByIds(['a']);

  expect(mockRun).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({
      tenant: undefined,
      next: { revalidate: 3600, tags: ['posts', 'author', 'category'] },
    }),
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @blog/service test entities/posts/adaptor/loader -- --run`
Expected: FAIL — `getPostsByIds` doesn't accept a second parameter yet.

- [ ] **Step 3: Update the loader**

```typescript
// packages/service/src/features/entities/posts/adaptor/loader.ts — full replacement
import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';
import type { TPostCard } from '@blog/service/shared/transformers/to-post-card';

import { postsByIdsQuery } from './query';
import { toPostsByIds } from './transformer';

/**
 * Post-card data for an explicit list of Sanity `_id`s, in whatever order
 * the query returns them — callers that need a specific order (e.g. a
 * reader's bookmarks sorted by save date) re-sort by id themselves.
 */
export async function getPostsByIds(
  ids: string[],
  tenant?: TTenantSanityContext,
): Promise<TPostCard[]> {
  if (ids.length === 0) return [];

  const raw = await runQuery(postsByIdsQuery, {
    parameters: { ids },
    tenant,
    ...isr(['posts', 'author', 'category'], tenant?.projectId),
  });

  return toPostsByIds(raw);
}
```

- [ ] **Step 4: Run loader test to verify it passes**

Run: `pnpm --filter @blog/service test entities/posts/adaptor/loader -- --run`
Expected: PASS

- [ ] **Step 5: Write the failing test (application service)**

```typescript
// packages/service/src/features/entities/posts/application/service.test.ts
import { getPostsByIds } from '@blog/service/features/entities/posts/adaptor/loader';

import { createPostsService } from './service';

vi.mock('@blog/service/features/entities/posts/adaptor/loader', () => ({
  getPostsByIds: vi.fn(),
}));

describe(createPostsService, () => {
  it('threads an optional tenant context through to the loader', async () => {
    const tenant = {
      projectId: 'tenant-a',
      dataset: 'production',
      token: 'tok',
    };
    vi.mocked(getPostsByIds).mockResolvedValue([]);

    await createPostsService().v1.getPostsByIds(['a'], tenant);

    expect(getPostsByIds).toHaveBeenCalledWith(['a'], tenant);
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `pnpm --filter @blog/service test entities/posts/application/service -- --run`
Expected: FAIL — `v1.getPostsByIds` doesn't accept/forward a second argument.

- [ ] **Step 7: Update the application service**

```typescript
// packages/service/src/features/entities/posts/application/service.ts — full replacement
import { getPostsByIds } from '@blog/service/features/entities/posts/adaptor/loader';
import type { TTenantSanityContext } from '@blog/service/sanity/query';
import { safeAsync } from '@blog/utils';

export function createPostsService() {
  return {
    v1: {
      getPostsByIds: safeAsync((ids: string[], tenant?: TTenantSanityContext) =>
        getPostsByIds(ids, tenant),
      ),
    },
  };
}
```

- [ ] **Step 8: Run test to verify it passes, then the full service suite**

Run: `pnpm --filter @blog/service test entities/posts -- --run`
Expected: PASS

Run: `pnpm --filter @blog/service test -- --run`
Expected: PASS — full suite green, no other loader affected.

- [ ] **Step 9: Commit**

```bash
git add packages/service/src/features/entities/posts
git commit -m "feat(service): migrate getPostsByIds to optional tenant context"
```

---

### Task 9: `apps/web` — `getTenantSanityContext()` server helper

**Files:**

- Create: `apps/web/src/server/tenant/get-tenant-sanity-context.ts`
- Create: `apps/web/src/server/tenant/get-tenant-sanity-context.test.ts`

**Interfaces:**

- Consumes: `getRequestTenantId` (existing, `apps/web/src/server/tenant/get-request-tenant-id.ts`);
  `queries.tenants.getTenantSanityCredentials` from `@blog/db`.
- Produces: `getTenantSanityContext(): Promise<TTenantSanityContext | undefined>`.

- [ ] **Step 1: Write the failing test**

```typescript
// apps/web/src/server/tenant/get-tenant-sanity-context.test.ts
import { getRequestTenantId } from '@web/server/tenant/get-request-tenant-id';
import { queries } from '@blog/db';

import { getTenantSanityContext } from './get-tenant-sanity-context';

vi.mock('@web/server/tenant/get-request-tenant-id', () => ({
  getRequestTenantId: vi.fn(),
}));
vi.mock('@blog/db', () => ({
  queries: { tenants: { getTenantSanityCredentials: vi.fn() } },
}));

describe(getTenantSanityContext, () => {
  it('resolves undefined when no tenant is resolved for the request', async () => {
    vi.mocked(getRequestTenantId).mockResolvedValue(undefined);

    await expect(getTenantSanityContext()).resolves.toBeUndefined();
    expect(queries.tenants.getTenantSanityCredentials).not.toHaveBeenCalled();
  });

  it('resolves the tenant Sanity credentials for the request-scoped tenant id', async () => {
    vi.mocked(getRequestTenantId).mockResolvedValue('tenant-uuid');
    vi.mocked(queries.tenants.getTenantSanityCredentials).mockResolvedValue({
      projectId: 'proj',
      dataset: 'production',
      token: 'tok',
    });

    await expect(getTenantSanityContext()).resolves.toEqual({
      projectId: 'proj',
      dataset: 'production',
      token: 'tok',
    });
    expect(queries.tenants.getTenantSanityCredentials).toHaveBeenCalledWith(
      'tenant-uuid',
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter web test server/tenant/get-tenant-sanity-context -- --run`
Expected: FAIL — module doesn't exist yet.

- [ ] **Step 3: Write the implementation**

```typescript
// apps/web/src/server/tenant/get-tenant-sanity-context.ts
import { queries } from '@blog/db';
import type { TTenantSanityContext } from '@blog/service/sanity/query';

import { getRequestTenantId } from './get-request-tenant-id';

/**
 * Resolves the current request's tenant Sanity credentials, if any. Callers
 * pass the result straight into a `service.*.v1.*` call's optional `tenant`
 * argument — `undefined` (no resolved tenant, or a tenant with no token set
 * yet) means "use the legacy single-tenant client," matching today's
 * behavior for the one seeded tenant.
 */
export async function getTenantSanityContext(): Promise<
  TTenantSanityContext | undefined
> {
  const tenantId = await getRequestTenantId();
  if (!tenantId) return undefined;

  return queries.tenants.getTenantSanityCredentials(tenantId);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter web test server/tenant/get-tenant-sanity-context -- --run`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/server/tenant/get-tenant-sanity-context.ts \
  apps/web/src/server/tenant/get-tenant-sanity-context.test.ts
git commit -m "feat(web): add getTenantSanityContext server helper"
```

---

### Task 10: wire the bookmarks page to the resolved tenant

**Files:**

- Modify: `apps/web/src/components/pages/bookmarks-page/bookmarks-page.tsx`
- Modify: `apps/web/src/components/pages/bookmarks-page/bookmarks-page.test.tsx`
  (only if it currently mocks `service.entities.posts.v1.getPostsByIds` with
  an exact-arity assertion — update the mock's expected call signature to
  include the tenant argument; otherwise no change needed)

**Interfaces:**

- Consumes: `getTenantSanityContext` from Task 9;
  `service.entities.posts.v1.getPostsByIds(ids, tenant?)` from Task 8.

- [ ] **Step 1: Read the current call site**

`apps/web/src/components/pages/bookmarks-page/bookmarks-page.tsx:63` calls
`await service.entities.posts.v1.getPostsByIds(bookmarkOrder);`. Read the
full file first — this task only changes this one call, not the surrounding
page logic.

- [ ] **Step 2: Thread the resolved tenant through**

```typescript
// apps/web/src/components/pages/bookmarks-page/bookmarks-page.tsx — add the
// import and change the call site (line numbers per the file read in Step 1):
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';

// ...inside the async component, before the existing getPostsByIds call:
const tenant = await getTenantSanityContext();
const result = await service.entities.posts.v1.getPostsByIds(
  bookmarkOrder,
  tenant,
);
```

- [ ] **Step 3: Check and update the existing page test if needed**

Run: `pnpm --filter web test bookmarks-page -- --run`

If it fails because a mock asserts `getPostsByIds` was called with exactly
one argument, update that assertion to `toHaveBeenCalledWith(bookmarkOrder,
undefined)` (the test's mocked `getTenantSanityContext` — add a
`vi.mock('@web/server/tenant/get-tenant-sanity-context', () => ({
getTenantSanityContext: vi.fn().mockResolvedValue(undefined) }))` if the
file doesn't already mock server/tenant helpers) — mirroring how this page's
existing tests already mock other `@web/server/*` reads.

- [ ] **Step 4: Run the full web test suite**

Run: `pnpm --filter web test -- --run`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/pages/bookmarks-page
git commit -m "feat(web): scope the bookmarks page's post fetch to the resolved tenant"
```

---

### Task 11: tenant-aware revalidation webhook

**Files:**

- Modify: `apps/web/src/app/api/revalidate/route.ts`
- Modify: `apps/web/src/app/api/revalidate/route.test.ts`

**Interfaces:**

- Consumes: the `sanity-project-id` header Sanity sends automatically on
  every webhook request (verified against Sanity's webhook docs — no CMS
  webhook config change needed).
- Produces: no new exports — same `POST` handler, now also purging the
  `t:<projectId>:<tag>` form alongside the legacy unprefixed tag.

- [ ] **Step 1: Write the failing test**

```typescript
// apps/web/src/app/api/revalidate/route.test.ts — add a new test case to the
// existing suite (read the file first for its exact existing mock setup for
// `isValidSignature`/`revalidateTag`/`revalidatePath`, then follow the same
// pattern):

it('revalidates both the legacy tag and the tenant-scoped tag when sanity-project-id is present', async () => {
  mockIsValidSignature.mockResolvedValue(true);
  const request = new Request('http://localhost/api/revalidate', {
    method: 'POST',
    headers: {
      [SIGNATURE_HEADER_NAME]: 'valid-signature',
      'sanity-project-id': 'tenant-a-project',
    },
    body: JSON.stringify({ _type: 'blog_post', _id: 'post-1' }),
  });

  await POST(request);

  expect(mockRevalidateTag).toHaveBeenCalledWith('post', { expire: 0 });
  expect(mockRevalidateTag).toHaveBeenCalledWith('t:tenant-a-project:post', {
    expire: 0,
  });
  expect(mockRevalidateTag).toHaveBeenCalledWith('posts', { expire: 0 });
  expect(mockRevalidateTag).toHaveBeenCalledWith('t:tenant-a-project:posts', {
    expire: 0,
  });
});

it('revalidates only the legacy tag when sanity-project-id is absent', async () => {
  mockIsValidSignature.mockResolvedValue(true);
  const request = new Request('http://localhost/api/revalidate', {
    method: 'POST',
    headers: { [SIGNATURE_HEADER_NAME]: 'valid-signature' },
    body: JSON.stringify({ _type: 'blog_post', _id: 'post-1' }),
  });

  await POST(request);

  expect(mockRevalidateTag).toHaveBeenCalledWith('post', { expire: 0 });
  expect(mockRevalidateTag).not.toHaveBeenCalledWith(
    expect.stringMatching(/^t:/),
    expect.anything(),
  );
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter web test api/revalidate/route -- --run`
Expected: FAIL — the handler doesn't read `sanity-project-id` or emit a
prefixed tag yet.

- [ ] **Step 3: Update the handler**

```typescript
// apps/web/src/app/api/revalidate/route.ts — replace the body from
// `const { _type: type, _id: id } = parsedBody;` through the `revalidateTag`
// loop with:
const { _type: type, _id: id } = parsedBody;
const baseTags = getRevalidateTagsForType(type, id);
// Sanity includes this header on every webhook request automatically
// (no custom GROQ projection needed) — it identifies which tenant's
// project published. Emitting both the legacy and tenant-scoped form
// keeps this webhook correct regardless of how many service.* loaders
// have migrated to tenant-scoped tags yet (an unmigrated loader's cache
// only ever holds the legacy tag; a migrated one only the prefixed tag —
// purging both is a no-op for whichever one wasn't actually set).
const tenantProjectId = request.headers.get('sanity-project-id');
const revalidated = tenantProjectId
  ? [...baseTags, ...baseTags.map((tag) => `t:${tenantProjectId}:${tag}`)]
  : baseTags;

for (const tag of revalidated) {
  // `{ expire: 0 }` forces immediate expiration — the next request blocks
  // and renders fresh. The profile shorthand ('max' etc.) is a *stale
  // window*: it keeps serving old content while revalidating in the
  // background, which for a publish webhook means updates never appear.
  revalidateTag(tag, { expire: 0 });
}
```

(Leave the `revalidatePath('/', 'layout')` block below unchanged — accepted
as the global v1 fallback per the spec's resolved decision.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter web test api/revalidate/route -- --run`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/api/revalidate/route.ts apps/web/src/app/api/revalidate/route.test.ts
git commit -m "feat(web): revalidation webhook purges tenant-scoped tags alongside legacy tags"
```

---

### Task 12: spec sync (orchestrator does this directly)

**Files:**

- Modify: `SPEC.md` (§9 rendering/caching/ISR, and §4 layer contracts if a
  new env var counts as a contract-visible change per this repo's own
  convention — check §4's existing shape before deciding)
- Modify: `docs/superpowers/specs/2026-08-07-multi-tenant-architecture-design.md`
  — update §2's "every existing `service.*` call gains the tenant context"
  line to note this is now **in progress** (Task 8 proved the pattern on one
  loader; the remaining 29 are epic 2b, tracked separately) rather than
  fully complete.

- [ ] **Step 1: Update `SPEC.md` §9**

Add a paragraph describing: cache tags can now be tenant-scoped
(`t:<projectId>:<tag>`), the revalidation webhook purges both forms per
publish, and `getClient()`/`runQuery()`/`isr()` are backward-compatible
(no-arg = legacy single-tenant behavior) during the loader-by-loader
migration.

- [ ] **Step 2: Do NOT delete the design spec yet**

Per `CLAUDE.md`'s design-doc retention rule, the multi-tenant spec is
deleted only once **all** its phases ship and `SPEC.md` fully reflects the
final shape — epic 2b (the other 29 loaders) and Phases 3–7 of this epic
sequence are still outstanding, so this doc stays.

- [ ] **Step 3: Commit**

```bash
git add SPEC.md docs/superpowers/specs/2026-08-07-multi-tenant-architecture-design.md
git commit -m "docs(spec): record tenant-scoped ISR infrastructure landing (epic 2a)"
```

---

## Self-Review

**Spec coverage:** §1 (registry/resolution) — already shipped, out of this
plan's scope. §2 (per-tenant client, tenant-scoped ISR, revalidation
tenant-awareness) — Tasks 1–11 cover the full mechanism, proven on one
loader; the remaining 29 loaders are explicitly epic 2b, not silently
dropped (noted in Task 12 and in this plan's Goal). §3–7 (engagement, auth,
Studio, theming, provisioning) are other epics, correctly out of scope here.

**Placeholder scan:** every step has real, complete code — no "add
appropriate error handling," no "similar to Task N" without the actual
code, no unresolved types.

**Type consistency:** `TTenantSanityContext` (Task 6) is used identically
in Tasks 7, 8, 9, 10 — `{ projectId: string; dataset: string; token:
string }` throughout, always optional (`tenant?:`), always `undefined` as
the explicit "no tenant" signal, never a partially-filled object.
`TTenantSanityCredentials` (Task 4, `@blog/db`) has the same shape as
`TTenantSanityContext` (Task 6, `@blog/service`) by design but is a
**separate type in a separate package** — `@blog/service` never imports
`@blog/db` per the layer contract, so `apps/web`'s `getTenantSanityContext`
(Task 9) is the only place a `TTenantSanityCredentials` value is passed
where a `TTenantSanityContext` is expected; their structural identity
(TypeScript structural typing) is what makes that assignment type-check
without either package importing the other.
