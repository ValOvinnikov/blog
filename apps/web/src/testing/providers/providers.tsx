import { SITE_MESSAGES } from '@blog/config';
import { SanityImageBaseUrlProvider } from '@web/context/sanity-image-base-url-provider';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';

/**
 * Fixed base URL every `SanityImage` renders against under Vitest or
 * Storybook — neither context resolves a real tenant to derive one from.
 */
export const STATIC_SANITY_IMAGE_BASE_URL =
  'https://cdn.sanity.io/images/test-project/test-dataset/';

export interface IAppProvidersProps {
  children: ReactNode;
}

/**
 * The fixed `NextIntlClientProvider` + `SanityImageBaseUrlProvider` stack
 * `[tenant]/[locale]/layout.tsx` provides in the real app, reused by both
 * `@web/testing/custom-render` and `.storybook/preview.tsx` so a component
 * under test or in Storybook never throws for a missing provider.
 */
export const AppProviders = ({ children }: IAppProvidersProps) => (
  <NextIntlClientProvider locale="en" messages={SITE_MESSAGES}>
    <SanityImageBaseUrlProvider baseUrl={STATIC_SANITY_IMAGE_BASE_URL}>
      {children}
    </SanityImageBaseUrlProvider>
  </NextIntlClientProvider>
);
