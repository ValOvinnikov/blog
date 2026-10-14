import { LOCALE_ISO_CODES } from '@blog/config';
import { ToastProvider } from '@platform/context/toast-provider';
import { UnsavedChangesProvider } from '@platform/context/unsaved-changes-provider';
import messages from '@platform/i18n/messages/en.json';
import {
  render as rtlRender,
  renderHook as rtlRenderHook,
  type RenderHookOptions,
  type RenderHookResult,
  type RenderOptions,
  type RenderResult,
} from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { createElement, type ComponentType, type ReactNode } from 'react';

type TRenderOpts = Omit<RenderOptions, 'wrapper'>;

// Client renders need the real intl provider, as every page gets from `[locale]/layout.tsx`.
const AppProviders = ({ children }: { children: ReactNode }) => (
  <NextIntlClientProvider locale={LOCALE_ISO_CODES.EN} messages={messages}>
    <ToastProvider>
      <UnsavedChangesProvider>{children}</UnsavedChangesProvider>
    </ToastProvider>
  </NextIntlClientProvider>
);

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

export const renderHookWithIntl = <TResult, TProps>(
  callback: (props: TProps) => TResult,
  options?: Omit<RenderHookOptions<TProps>, 'wrapper'>,
): RenderHookResult<TResult, TProps> =>
  rtlRenderHook(callback, { ...options, wrapper: AppProviders });

export * from '@testing-library/react';
