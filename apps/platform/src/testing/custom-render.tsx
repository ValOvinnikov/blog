import { LOCALE_ISO_CODES } from '@blog/config';
import { ToastProvider } from '@platform/context/toast-provider';
import { UnsavedChangesProvider } from '@platform/context/unsaved-changes-provider';
import messages from '@platform/i18n/messages/en.json';
import {
  render as rtlRender,
  type RenderOptions,
  type RenderResult,
} from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { createElement, type ComponentType, type ReactNode } from 'react';

type TRenderOpts = Omit<RenderOptions, 'wrapper'>;

// Mirrors `[locale]/layout.tsx`'s client providers, which every rendered tree sits under live.
const AppProviders = ({ children }: { children: ReactNode }) => (
  <NextIntlClientProvider locale={LOCALE_ISO_CODES.EN} messages={messages}>
    <ToastProvider>
      <UnsavedChangesProvider>{children}</UnsavedChangesProvider>
    </ToastProvider>
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
    return rtlRender(ui, { ...options, wrapper: AppProviders });
  };
};

export const renderWithIntl = (
  ui: ReactNode,
  options?: TRenderOpts,
): RenderResult => rtlRender(ui, { ...options, wrapper: AppProviders });

/**
 * Bind a (sync) component + its default props once, get a `setup(overrides?)`
 * renderer — the sync counterpart of `customRenderAsync`, for the common case
 * of many tests rendering the same component with one or two props varied.
 */
export const customRender = <P extends object>(
  Component: ComponentType<P>,
  defaultProps: NoInfer<P>,
) => {
  return (overrides?: Partial<P>, options?: TRenderOpts): RenderResult =>
    rtlRender(createElement(Component, { ...defaultProps, ...overrides }), {
      ...options,
      wrapper: AppProviders,
    });
};

export * from '@testing-library/react';
