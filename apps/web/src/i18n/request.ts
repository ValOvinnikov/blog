import { SITE_MESSAGES_BY_LOCALE } from '@blog/config';
import { peekVoiceTenant } from '@web/server/request-context/request-context';
import { resolveTenantMessages } from '@web/utils/resolve-tenant-messages';
import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';

import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;
  const baseMessages = SITE_MESSAGES_BY_LOCALE[locale];
  const voiceTenant = await peekVoiceTenant(locale);

  if (!voiceTenant) return { locale, messages: baseMessages };

  const { messages } = await resolveTenantMessages(baseMessages, voiceTenant);
  return { locale, messages };
});
