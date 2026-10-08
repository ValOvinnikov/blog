import { CAPABILITY, SITE_MESSAGES_BY_LOCALE } from '@blog/config';
import { getSanityImageBaseUrl } from '@blog/service';
import { ConsentBannerSlot } from '@web/components/shared/consent-banner-slot';
import { ConsentPreferencesDialog } from '@web/components/shared/consent-preferences-dialog';
import { ConsentProvider } from '@web/context/consent-provider';
import { SanityImageBaseUrlProvider } from '@web/context/sanity-image-base-url-provider';
import { ToastProvider } from '@web/context/toast-provider';
import { VoiceRichProvider } from '@web/context/voice-rich-provider';
import { getRequestContext } from '@web/server/request-context/request-context';
import { isCapabilityEnabled } from '@web/server/settings-features/is-capability-enabled/is-capability-enabled';
import { UNRESOLVED_TENANT_PLACEHOLDER } from '@web/server/tenant/constants/constants';
import { resolveTenantMessages } from '@web/utils/resolve-tenant-messages';
import { resolveVoiceRichFields } from '@web/utils/resolve-voice-rich-fields';
import { SessionProvider } from 'next-auth/react';
import { NextIntlClientProvider } from 'next-intl';
import { getNow, getTimeZone } from 'next-intl/server';
import type { ReactNode } from 'react';

export interface ISiteProvidersProps {
  children: ReactNode;
}

export const SiteProviders = async ({ children }: ISiteProvidersProps) => {
  const { tenantId, locale, sanityContext, defaultLocale } =
    await getRequestContext();
  const tenant = tenantId ?? UNRESOLVED_TENANT_PLACEHOLDER;
  const baseMessages = SITE_MESSAGES_BY_LOCALE[locale];
  const [now, timeZone, isConsentBannerEnabled] = await Promise.all([
    getNow(),
    getTimeZone(),
    isCapabilityEnabled(CAPABILITY.CONSENT_BANNER),
  ]);
  const { messages, rich } =
    locale === defaultLocale
      ? await resolveTenantMessages(baseMessages, tenant)
      : {
          messages: baseMessages,
          rich: resolveVoiceRichFields({}, baseMessages),
        };

  return (
    <SanityImageBaseUrlProvider baseUrl={getSanityImageBaseUrl(sanityContext)}>
      {/* locale, now and timeZone are passed explicitly so the provider never resolves them dynamically, keeping the page static. */}
      <NextIntlClientProvider
        locale={locale}
        messages={messages}
        now={now}
        timeZone={timeZone}
      >
        <SessionProvider>
          <ToastProvider>
            <VoiceRichProvider values={rich}>
              <ConsentProvider>
                {children}
                <ConsentBannerSlot isEnabled={isConsentBannerEnabled} />
                <ConsentPreferencesDialog />
              </ConsentProvider>
            </VoiceRichProvider>
          </ToastProvider>
        </SessionProvider>
      </NextIntlClientProvider>
    </SanityImageBaseUrlProvider>
  );
};
