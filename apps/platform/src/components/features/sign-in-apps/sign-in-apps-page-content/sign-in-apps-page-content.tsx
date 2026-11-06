import { ALERT_TYPE } from '@blog/config';
import { PLAN_ENTITLEMENTS } from '@blog/db/constants';
import type { TAdmin } from '@blog/db/schema/admins';
import type { TMembership } from '@blog/db/schema/memberships';
import type { TTenant } from '@blog/db/schema/tenants';
import { SignInAppCard } from '@platform/components/features/sign-in-apps/sign-in-app-card';
import { SignInAppReadOnlyCard } from '@platform/components/features/sign-in-apps/sign-in-app-read-only-card';
import { SignInAppsFreeCard } from '@platform/components/features/sign-in-apps/sign-in-apps-free-card';
import { SignInAppsGrowthNote } from '@platform/components/features/sign-in-apps/sign-in-apps-growth-note';
import { Alert } from '@platform/components/shared/alert';
import { PageHeader } from '@platform/components/shared/page-header';
import {
  SIGN_IN_APPS_MODE,
  type TSignInAppsMode,
} from '@platform/constants/sign-in-apps';
import { isTenantOwner } from '@platform/server/auth/is-tenant-owner';
import { loadSignInApps } from '@platform/server/sign-in-apps/load-sign-in-apps';
import { getTranslations } from 'next-intl/server';

import { signInAppsPageContentVariants } from './sign-in-apps-page-content-variants';

export type TSignInAppsPageContentProps = {
  tenant: TTenant;
  membership?: TMembership;
  admin?: TAdmin;
};

const resolveMode = ({
  tenant,
  membership,
  admin,
}: TSignInAppsPageContentProps): TSignInAppsMode => {
  if (admin) return SIGN_IN_APPS_MODE.OPERATOR;
  if (!PLAN_ENTITLEMENTS[tenant.plan].hasOwnOAuthApps) {
    return SIGN_IN_APPS_MODE.FREE;
  }
  if (tenant.deprovisionedAt || !membership || !isTenantOwner(membership)) {
    return SIGN_IN_APPS_MODE.READ_ONLY;
  }
  return SIGN_IN_APPS_MODE.EDIT;
};

export const SignInAppsPageContent = async (
  context: TSignInAppsPageContentProps,
) => {
  const { tenant } = context;
  const { id, primaryDomain, deprovisionedAt } = tenant;
  const mode = resolveMode(context);
  const [t, apps] = await Promise.all([
    getTranslations('signInAppsPage'),
    loadSignInApps(tenant, mode),
  ]);
  const notice = deprovisionedAt ? 'archivedNotice' : 'notOwnerNotice';
  const { root } = signInAppsPageContentVariants();

  return (
    <div className={root()}>
      <PageHeader title={t('pageTitle')} description={t('description')} />

      {mode === SIGN_IN_APPS_MODE.READ_ONLY && (
        <Alert type={ALERT_TYPE.INFO} role="note" description={t(notice)} />
      )}

      {mode === SIGN_IN_APPS_MODE.FREE && (
        <>
          <SignInAppsGrowthNote />
          <SignInAppsFreeCard apps={apps} />
        </>
      )}

      {mode === SIGN_IN_APPS_MODE.EDIT &&
        apps.map((app) => (
          <SignInAppCard
            key={app.provider}
            tenantId={id}
            app={app}
            domain={primaryDomain}
          />
        ))}

      {(mode === SIGN_IN_APPS_MODE.READ_ONLY ||
        mode === SIGN_IN_APPS_MODE.OPERATOR) &&
        apps.map((app) => (
          <SignInAppReadOnlyCard
            key={app.provider}
            app={app}
            domain={primaryDomain}
            isOperator={mode === SIGN_IN_APPS_MODE.OPERATOR}
          />
        ))}
    </div>
  );
};
