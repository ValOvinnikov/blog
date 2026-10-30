import { service } from '@blog/service';
import { CONSENT_LOG } from '@web/constants/consent';
import type { TModuleComponentProps } from '@web/modules/module-renderer';
import { getRequestContext } from '@web/server/request-context/request-context';
import { logger } from '@web/utils/logger/logger';
import { getTranslations } from 'next-intl/server';

import { CookieSettingsModuleView } from './cookie-settings-module-view';

export type TCookieSettingsModuleProps = TModuleComponentProps;

export const CookieSettingsModule = async ({
  id,
}: TCookieSettingsModuleProps) => {
  const { sanityContext } = await getRequestContext();
  const [result, t] = await Promise.all([
    service.modules.cookieSettings.v1.getCookieSettings(id, sanityContext),
    getTranslations('consent.preferences'),
  ]);

  if (!result.ok) {
    logger.error(CONSENT_LOG.MODULE_FETCH_FAILED, { id, error: result.error });
    return null;
  }

  const { brandVariant, headingBlock, layout } = result.data;

  return (
    <CookieSettingsModuleView
      id={id}
      brandVariant={brandVariant}
      headingBlock={headingBlock ?? { heading: t('heading') }}
      layout={layout}
    />
  );
};
