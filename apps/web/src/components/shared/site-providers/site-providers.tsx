import { CAPABILITY, SITE_MESSAGES_BY_LOCALE } from '@blog/config';
import { getSanityImageBaseUrl } from '@blog/service';
import { ConsentBannerSlot } from '@web/components/shared/consent-banner-slot';
import { ConsentPreferencesDialog } from '@web/components/shared/consent-preferences-dialog';
import { BusyStyleProvider } from '@web/context/busy-style-provider';
import { ConsentPreferencesProvider } from '@web/context/consent-preferences-provider';
import { HeaderOverlayProvider } from '@web/context/header-overlay-provider';
import { SanityImageBaseUrlProvider } from '@web/context/sanity-image-base-url-provider';
import { ToastProvider } from '@web/context/toast-provider';
import { VoiceRichProvider } from '@web/context/voice-rich-provider';
import { getRequestContext } from '@web/server/request-context/request-context';
import { isCapabilityEnabled } from '@web/server/settings-features/is-capability-enabled/is-capability-enabled';
import { getBusyStyle } from '@web/server/site-config/get-busy-style/get-busy-style';
import { UNRESOLVED_TENANT_PLACEHOLDER } from '@web/server/tenant/constants/constants';
import { resolveTenantMessages } from '@web/utils/resolve-tenant-messages';
import { SessionProvider } from 'next-auth/react';
import { NextIntlClientProvider } from 'next-intl';
import { getNow, getTimeZone } from 'next-intl/server';
import type { ReactNode } from 'react';

export interface ISiteProvidersProps {
  children: ReactNode;
}

export const SiteProviders = async ({ children }: ISiteProvidersProps) => {
  const { tenantId, locale, sanityContext } = await getRequestContext();
  const tenant = tenantId ?? UNRESOLVED_TENANT_PLACEHOLDER;
  const baseMessages = SITE_MESSAGES_BY_LOCALE[locale];
  const [now, timeZone, isConsentBannerEnabled, busyStyle] = await Promise.all([
    getNow(),
    getTimeZone(),
    isCapabilityEnabled(CAPABILITY.CONSENT_BANNER),
    getBusyStyle(tenant),
  ]);
  const { messages, rich } = await resolveTenantMessages(
    baseMessages,
    locale,
    tenant,
  );

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
          <BusyStyleProvider value={busyStyle}>
            <ToastProvider>
              <VoiceRichProvider values={rich}>
                <ConsentPreferencesProvider>
                  <HeaderOverlayProvider>{children}</HeaderOverlayProvider>
                  <ConsentBannerSlot isEnabled={isConsentBannerEnabled} />
                  <ConsentPreferencesDialog />
                </ConsentPreferencesProvider>
              </VoiceRichProvider>
            </ToastProvider>
          </BusyStyleProvider>
        </SessionProvider>
      </NextIntlClientProvider>
    </SanityImageBaseUrlProvider>
  );
};
