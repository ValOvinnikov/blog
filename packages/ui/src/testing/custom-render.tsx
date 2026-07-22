import {
  render as rtlRender,
  type RenderOptions,
} from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';

/**
 * Provider wrapper for @blog/ui component tests. The library is pure and
 * prop-driven, so there are no providers to mount today — this is the single
 * place to add one if a component ever needs context in a test.
 */
const Providers = ({ children }: { children: ReactNode }) => <>{children}</>;

/**
 * Custom render for @blog/ui component tests — wraps Testing Library's render
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
