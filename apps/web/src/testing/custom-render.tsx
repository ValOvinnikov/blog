import { SITE_MESSAGES } from '@blog/config';
import {
  render as rtlRender,
  type RenderOptions,
  type RenderResult,
} from '@testing-library/react';
import { SanityImageBaseUrlProvider } from '@web/context/sanity-image-base-url-provider';
import { NextIntlClientProvider } from 'next-intl';
import {
  createElement,
  type ComponentType,
  type ReactElement,
  type ReactNode,
} from 'react';

/** The `SanityImage` bridge's base URL under test, unless a test nests its own override provider. */
export const TEST_SANITY_IMAGE_BASE_URL =
  'https://cdn.sanity.io/images/test-project/test-dataset/';

/**
 * Mounts the same NextIntlClientProvider and SanityImageBaseUrlProvider the
 * app layout provides, with the real catalog messages — so a client
 * component reading `useTranslations` or rendering a `SanityImage` behaves
 * as it does under the real app instead of throwing/falling back.
 */
const Providers = ({ children }: { children: ReactNode }) => (
  <NextIntlClientProvider locale="en" messages={SITE_MESSAGES}>
    <SanityImageBaseUrlProvider baseUrl={TEST_SANITY_IMAGE_BASE_URL}>
      {children}
    </SanityImageBaseUrlProvider>
  </NextIntlClientProvider>
);

type TRenderOpts = Omit<RenderOptions, 'wrapper'>;

/**
 * Bind a (sync) component + its default props once, get a `setup(overrides?)`
 * renderer. `setup()` renders with the defaults; `setup({ prop })` overrides.
 */
export const customRender = <P extends object>(
  Component: ComponentType<P>,
  defaultProps: NoInfer<P>,
) => {
  return (overrides?: Partial<P>, options?: TRenderOpts): RenderResult =>
    rtlRender(createElement(Component, { ...defaultProps, ...overrides }), {
      wrapper: Providers,
      ...options,
    });
};

/**
 * Async-server-component variant: binds an async component + default props;
 * `await setup(overrides?)` awaits the component with the merged props, then
 * renders the result. Also lets `await expect(setup({…})).rejects.toThrow(…)`
 * work for pages that throw (e.g. notFound()) before returning JSX.
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
    return rtlRender(<>{ui}</>, { wrapper: Providers, ...options });
  };
};

/** Provider-wrapped direct render for ad-hoc/pre-built JSX. */
export const renderElement = (
  ui: ReactElement,
  options?: TRenderOpts,
): RenderResult => rtlRender(ui, { wrapper: Providers, ...options });

// Re-export the full RTL surface so tests import screen/fireEvent/etc. from here.
export * from '@testing-library/react';
