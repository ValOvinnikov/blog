import messages from '@admin/i18n/messages/en.json';
import { LOCALE_ISO_CODES } from '@blog/config';
import {
  render as rtlRender,
  type RenderOptions,
  type RenderResult,
} from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';

type TRenderOpts = Omit<RenderOptions, 'wrapper'>;

/**
 * `next-intl/server`'s `getTranslations` is mocked globally (see
 * `vitest-setup.ts`), but `useTranslations` — the client-side hook a
 * non-async component or a `'use client'` leaf calls — reads real React
 * context, which Vitest's non-RSC environment never supplies on its own.
 * Every render helper below wraps with this so a rendered tree resolves the
 * same real `en.json` copy the app ships, regardless of how deep the first
 * `useTranslations` call sits.
 */
const withIntl = (ui: ReactNode): ReactNode => (
  <NextIntlClientProvider locale={LOCALE_ISO_CODES.EN} messages={messages}>
    {ui}
  </NextIntlClientProvider>
);

/**
 * Async-server-component variant: binds an async component + default props;
 * `await setup(overrides?)` awaits the component with the merged props, then
 * renders the result. Also lets `await expect(setup({…})).rejects.toThrow(…)`
 * work for routes that redirect before returning JSX.
 */
export const customRenderAsync = <P extends object>(
  Component: (props: P) => Promise<ReactNode>,
  defaultProps: NoInfer<P>,
) => {
  return async (
    overrides?: Partial<P>,
    options?: TRenderOpts,
  ): Promise<RenderResult> => {
    const ui = await Component({ ...defaultProps, ...overrides });
    return rtlRender(<>{withIntl(ui)}</>, options);
  };
};

/** Sync variant for a non-async or `'use client'` component. */
export const renderWithIntl = (
  ui: ReactNode,
  options?: TRenderOpts,
): RenderResult => rtlRender(<>{withIntl(ui)}</>, options);

// Re-export the full RTL surface so tests import screen/fireEvent/etc. from here.
export * from '@testing-library/react';
