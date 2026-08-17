'use server';

import { routing } from '@admin/i18n/routing';
import { requireAdmin } from '@admin/server/auth/require-admin';
import { dispatchProvisioningWorkflow } from '@admin/server/provisioning/dispatch-provisioning-workflow';
import { adminRoutes } from '@admin/utils/routes/routes';
import { TENANT_PLAN, type TTenantPlan } from '@blog/config';
import { queries } from '@blog/db';
import { sanitizeLogMessage } from '@blog/utils';
import { redirect } from 'next/navigation';
import { z } from 'zod';

// Studio-hostname slug only (`studio-<slug>.valstack.dev`) — the platform
// has no public subdomain scheme (custom domains only), so this never
// becomes part of the tenant's own site address.
const SLUG_PATTERN = /^[a-z0-9-]+$/;
const DOMAIN_PATTERN =
  /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/;

const createTenantInputSchema = z.object({
  name: z.string().trim().min(1, 'Enter a tenant name.'),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(SLUG_PATTERN, 'Lowercase letters, numbers, and hyphens only.'),
  domain: z
    .string()
    .trim()
    .toLowerCase()
    .regex(DOMAIN_PATTERN, 'Enter a valid domain.'),
  plan: z.enum(Object.values(TENANT_PLAN) as [TTenantPlan, ...TTenantPlan[]]),
  ownerEmail: z.string().trim().toLowerCase().email('Enter a valid email.'),
});

export type TCreateTenantInput = z.input<typeof createTenantInputSchema>;

export type TCreateTenantFieldErrors = Partial<
  Record<keyof TCreateTenantInput, string>
>;

export type TCreateTenantResult = {
  ok: false;
  error?: string;
  fieldErrors?: TCreateTenantFieldErrors;
};

/**
 * The Details step's submit handler — resolves the owner email to an
 * existing user (no invite-email flow), inserts the draft tenant row, kicks
 * off provisioning, and redirects straight to the tenant's status page.
 * There is no `{ ok: true }` return: `redirect()` throws before this
 * function can return normally, so every value this resolves to is a
 * failure the Details form should show inline.
 */
export async function createTenantAction(
  input: TCreateTenantInput,
): Promise<TCreateTenantResult> {
  await requireAdmin();

  const parsed = createTenantInputSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: TCreateTenantFieldErrors = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === 'string' && !(key in fieldErrors)) {
        fieldErrors[key as keyof TCreateTenantInput] = issue.message;
      }
    }
    return { ok: false, fieldErrors };
  }

  const { name, slug, domain, plan, ownerEmail } = parsed.data;

  const owner = await queries.users.getUserByEmail(ownerEmail);
  if (!owner) {
    return {
      ok: false,
      fieldErrors: { ownerEmail: 'No registered user matches this email.' },
    };
  }

  const [existingSlug, existingDomain] = await Promise.all([
    queries.tenants.getTenantBySlug(slug),
    queries.tenantDomains.getTenantByDomain(domain),
  ]);

  if (existingSlug) {
    return {
      ok: false,
      fieldErrors: { slug: 'This slug is already in use.' },
    };
  }

  if (existingDomain) {
    return {
      ok: false,
      fieldErrors: { domain: 'This domain is already in use.' },
    };
  }

  let tenantId: string;
  try {
    const tenant = await queries.tenants.createTenantDraft({
      name,
      slug,
      domain,
      locale: routing.defaultLocale,
      plan,
      ownerUserId: owner.id,
    });
    tenantId = tenant.id;
  } catch (error) {
    console.error('Failed to create tenant draft:', sanitizeLogMessage(error));
    return { ok: false, error: "Couldn't create the tenant — try again." };
  }

  await dispatchProvisioningWorkflow(tenantId);

  redirect(adminRoutes.tenantStatus(tenantId));
}
