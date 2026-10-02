import { getSanityImageBaseUrl } from '@blog/service';
import { SanityImageBaseUrlProvider } from '@web/context/sanity-image-base-url-provider';
import { ToastProvider } from '@web/context/toast-provider';
import { VoiceRichProvider } from '@web/context/voice-rich-provider';
import { getRequestContext } from '@web/server/request-context/request-context';
import { UNRESOLVED_TENANT_PLACEHOLDER } from '@web/server/tenant/unresolved-tenant-placeholder';
import { resolveTenantMessages } from '@web/utils/resolve-tenant-messages';
import { resolveVoiceRichFields } from '@web/utils/resolve-voice-rich-fields';
import { SessionProvider } from 'next-auth/react';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getNow, getTimeZone } from 'next-intl/server';
import type { ReactNode } from 'react';

export interface ISiteProvidersProps {
  children: ReactNode;
}

export const SiteProviders = async ({ children }: ISiteProvidersProps) => {
  const { tenantId, locale, sanityContext, defaultLocale } =
    await getRequestContext();
  const tenant = tenantId ?? UNRESOLVED_TENANT_PLACEHOLDER;
  const [baseMessages, now, timeZone] = await Promise.all([
    getMessages(),
    getNow(),
    getTimeZone(),
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
            <VoiceRichProvider values={rich}>{children}</VoiceRichProvider>
          </ToastProvider>
        </SessionProvider>
      </NextIntlClientProvider>
    </SanityImageBaseUrlProvider>
  );
};
