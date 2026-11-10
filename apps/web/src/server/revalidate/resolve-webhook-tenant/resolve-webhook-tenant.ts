import type { TMaybeNull, TMaybeUndefined } from '@blog/config';
import { HTTP_STATUS } from '@blog/config/constants';
import { queries } from '@blog/db';
import {
  REVALIDATE_LOG,
  TENANT_LOOKUP_FAILED_MESSAGE,
} from '@web/constants/revalidate';
import { recordTenantActivity } from '@web/server/revalidate/record-tenant-activity/record-tenant-activity';
import { logger } from '@web/utils/logger/logger';
import { NextResponse } from 'next/server';

/** The response that ends the webhook when its tenant cannot be served — `undefined` lets it continue, with the tenant's activity recorded. */
export const resolveWebhookTenant = async (
  tenantId: TMaybeUndefined<string>,
  tenantProjectId: TMaybeNull<string>,
): Promise<TMaybeUndefined<NextResponse>> => {
  if (!tenantId) {
    return undefined;
  }

  let tenant;
  try {
    tenant = await queries.tenants.getTenantById(tenantId);
  } catch (error) {
    logger.error(REVALIDATE_LOG.TENANT_BY_ID_LOOKUP_FAILED, {
      tenantId,
      error,
    });
    return NextResponse.json(
      { message: TENANT_LOOKUP_FAILED_MESSAGE },
      { status: HTTP_STATUS.BAD_GATEWAY },
    );
  }
  if (!tenant) {
    logger.warn(REVALIDATE_LOG.TENANT_ARCHIVED, { tenantProjectId, tenantId });
    return NextResponse.json(
      { message: 'Tenant is archived; event ignored.' },
      { status: HTTP_STATUS.OK },
    );
  }

  await recordTenantActivity(tenantId, new Date());
  return undefined;
};
