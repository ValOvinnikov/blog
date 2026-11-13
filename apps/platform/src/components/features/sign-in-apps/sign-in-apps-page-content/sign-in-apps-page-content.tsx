import { ALERT_TYPE } from '@blog/config';
import { SignInAppCard } from '@platform/components/features/sign-in-apps/sign-in-app-card';
import { SignInAppReadOnlyCard } from '@platform/components/features/sign-in-apps/sign-in-app-read-only-card';
import { SignInAppsFreeCard } from '@platform/components/features/sign-in-apps/sign-in-apps-free-card';
import { SignInAppsGrowthNote } from '@platform/components/features/sign-in-apps/sign-in-apps-growth-note';
import { SignInAppsGuardProvider } from '@platform/components/features/sign-in-apps/sign-in-apps-guard-provider';
import { Alert } from '@platform/components/shared/alert';
import { PageHeader } from '@platform/components/shared/page-header';
import {
  SIGN_IN_APPS_MODE,
  type TSignInAppsMode,
} from '@platform/constants/sign-in-apps';
import type { TPlatformViewer } from '@platform/server/auth/platform-viewer';
import { loadSignInApps } from '@platform/server/sign-in-apps/load-sign-in-apps';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';
import { getTranslations } from 'next-intl/server';

import { signInAppsPageContentVariants } from './sign-in-apps-page-content-variants';

export type TSignInAppsPageContentProps = {
  tenant: TPlatformTenant;
  viewer: TPlatformViewer;
};

const resolveMode = ({
  tenant,
  viewer,
}: TSignInAppsPageContentProps): TSignInAppsMode => {
  if (viewer.isOperator) {
    return SIGN_IN_APPS_MODE.OPERATOR;
  }
  if (!tenant.entitlements.hasOwnOAuthApps) {
    return SIGN_IN_APPS_MODE.FREE;
  }
  if (tenant.isArchived || !viewer.isOwner) {
    return SIGN_IN_APPS_MODE.READ_ONLY;
  }
  return SIGN_IN_APPS_MODE.EDIT;
};

export const SignInAppsPageContent = async (
  context: TSignInAppsPageContentProps,
) => {
  const { tenant } = context;
  const { id, primaryDomain, isArchived } = tenant;
  const mode = resolveMode(context);
  const [t, apps] = await Promise.all([
    getTranslations('signInAppsPage'),
    loadSignInApps(tenant, mode),
  ]);
  const notice = isArchived ? 'archivedNotice' : 'notOwnerNotice';
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

      {mode === SIGN_IN_APPS_MODE.EDIT && (
        <SignInAppsGuardProvider pageTitle={t('pageTitle')}>
          {apps.map((app) => (
            <SignInAppCard
              key={app.provider}
              tenantId={id}
              app={app}
              domain={primaryDomain}
            />
          ))}
        </SignInAppsGuardProvider>
      )}

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
