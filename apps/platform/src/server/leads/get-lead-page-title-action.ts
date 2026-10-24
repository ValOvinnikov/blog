'use server';

import { LOCALE_ISO_CODES, type TMaybeUndefined } from '@blog/config';
import { requireTenantOwner } from '@platform/server/auth/require-tenant-owner';
import { z } from 'zod';

import { fetchPageTitle } from './fetch-page-title';

const getLeadPageTitleInputSchema = z.object({
  tenantId: z.uuid(),
  documentId: z.string().min(1),
  locale: z.enum(LOCALE_ISO_CODES),
});

export const getLeadPageTitleAction = async (
  input: z.input<typeof getLeadPageTitleInputSchema>,
): Promise<TMaybeUndefined<string>> => {
  const parsed = getLeadPageTitleInputSchema.safeParse(input);
  if (!parsed.success) return undefined;

  const { tenant } = await requireTenantOwner(parsed.data.tenantId);

  return fetchPageTitle({ ...parsed.data, tenantId: tenant.id });
};
