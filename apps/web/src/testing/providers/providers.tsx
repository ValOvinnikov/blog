import { LOCALE_ISO_CODES, SITE_MESSAGES } from '@blog/config';
import { ConsentProvider } from '@web/context/consent-provider';
import { SanityImageBaseUrlProvider } from '@web/context/sanity-image-base-url-provider';
import { VoiceRichProvider } from '@web/context/voice-rich-provider';
import { resolveVoiceRichFields } from '@web/utils/resolve-voice-rich-fields';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';

/**
 * Fixed base URL every `SanityImage` renders against under Vitest or
 * Storybook — neither context resolves a real tenant to derive one from.
 */
export const STATIC_SANITY_IMAGE_BASE_URL =
  'https://cdn.sanity.io/images/test-project/test-dataset/';

const CATALOG_VOICE_RICH = resolveVoiceRichFields({}, SITE_MESSAGES);

export interface IAppProvidersProps {
  children: ReactNode;
}

/**
 * The fixed provider stack `[tenant]/[locale]/layout.tsx` provides in the
 * real app, reused by both `@web/testing/custom-render` and
 * `.storybook/preview.tsx` so a component under test or in Storybook never
 * throws for a missing provider.
 */
export const AppProviders = ({ children }: IAppProvidersProps) => (
  <NextIntlClientProvider locale={LOCALE_ISO_CODES.EN} messages={SITE_MESSAGES}>
    <SanityImageBaseUrlProvider baseUrl={STATIC_SANITY_IMAGE_BASE_URL}>
      <VoiceRichProvider values={CATALOG_VOICE_RICH}>
        <ConsentProvider>{children}</ConsentProvider>
      </VoiceRichProvider>
    </SanityImageBaseUrlProvider>
  </NextIntlClientProvider>
);
