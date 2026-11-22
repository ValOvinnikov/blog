'use server';

import { SUBSCRIBERS_LOG } from '@platform/constants/subscribers';
import { env } from '@platform/utils/env/env';
import { findSubdomain } from '@platform/utils/find-subdomain/find-subdomain';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import {
  toSubscribersCsv,
  toSubscribersFileName,
} from '@platform/utils/subscribers-csv/subscribers-csv';
import { ACTION_OUTCOME } from '@shinefold/config';
import { queries } from '@shinefold/db';
import { toOutcome } from '@shinefold/utils/to-outcome';

import { requireSubscribersManager } from './require-subscribers-manager';

type TSubscribersExport = {
  fileName: string;
  csv: string;
};

export type TExportSubscribersResult =
  | { outcome: typeof ACTION_OUTCOME.SUCCESS; data: TSubscribersExport }
  | { outcome: typeof ACTION_OUTCOME.SERVER_ERROR };

export const exportSubscribersAction = async (
  tenantId: string,
): Promise<TExportSubscribersResult> => {
  const { tenant } = await requireSubscribersManager(tenantId);
  const { id, primaryDomain } = tenant;

  try {
    const [subscribers, domains] = await Promise.all([
      queries.subscribers.listSubscribersForExport(id),
      queries.tenantDomains.listTenantDomains(id),
    ]);
    const siteAddress =
      findSubdomain(domains, env.TENANT_ROOT_DOMAIN) ?? primaryDomain;

    return {
      outcome: ACTION_OUTCOME.SUCCESS,
      data: {
        fileName: toSubscribersFileName(siteAddress, new Date()),
        csv: toSubscribersCsv(subscribers),
      },
    };
  } catch (error) {
    logger.error(SUBSCRIBERS_LOG.EXPORT_FAILED, {
      tenantId: id,
      ...toLoggableError(error),
    });
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }
};
