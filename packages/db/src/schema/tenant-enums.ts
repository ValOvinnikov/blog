import {
  LOCALE_ISO_CODES,
  SITE_TYPE,
  TENANT_PLAN,
} from '@blog/config/constants';
import { TENANT_STATUS } from '@blog/db/constants';
import { pgEnum } from 'drizzle-orm/pg-core';

export const tenantPlanEnum = pgEnum('tenant_plan', TENANT_PLAN);

export const localeCodeEnum = pgEnum('locale_code', LOCALE_ISO_CODES);

export const tenantStatusEnum = pgEnum('tenant_status', TENANT_STATUS);

export const siteTypeEnum = pgEnum('site_type', SITE_TYPE);
