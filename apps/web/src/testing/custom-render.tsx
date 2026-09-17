import {
  render as rtlRender,
  type RenderOptions,
  type RenderResult,
} from '@testing-library/react';
import { AppProviders } from '@web/testing/providers';
import {
  createElement,
  type ComponentType,
  type ReactElement,
  type ReactNode,
} from 'react';

const Providers = AppProviders;

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
 * RTL-renders the returned tree. Also lets
 * `await expect(setup({…})).rejects.toThrow(…)` work for pages that throw
 * (e.g. notFound()) before returning JSX. Awaiting only the top-level
 * component resolves its own promise, not any async Server Component still
 * unresolved in the JSX it returns — RTL's client renderer cannot render
 * those (`<X> is an async Client Component`), so any such child must be
 * mocked as a plain sync component in the test.
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
