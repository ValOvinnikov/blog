import {
  render as rtlRender,
  type RenderOptions,
} from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactElement, ReactNode } from 'react';

/**
 * Provider wrapper for apps/web component tests — mounts the same
 * NextIntlClientProvider the app layout provides, so components using
 * next-intl navigation/hooks render without per-test provider setup.
 */
const Providers = ({ children }: { children: ReactNode }) => (
  <NextIntlClientProvider locale="en" messages={null}>
    {children}
  </NextIntlClientProvider>
);

/**
 * Custom render for apps/web component tests — wraps Testing Library's render
 * with the shared providers. Component tests call this instead of RTL's
 * `render`; `screen`/`fireEvent`/etc. are re-exported below, so tests import
 * everything they need from this one module.
 */
export const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => rtlRender(ui, { wrapper: Providers, ...options });

// Re-export the full RTL surface so tests import screen/fireEvent/etc. from here.
export * from '@testing-library/react';
