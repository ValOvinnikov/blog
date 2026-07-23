import {
  render as rtlRender,
  type RenderOptions,
  type RenderResult,
} from '@testing-library/react';
import {
  createElement,
  type ComponentType,
  type ReactElement,
  type ReactNode,
} from 'react';

/**
 * Provider wrapper for @blog/ui component tests. The library is pure and
 * prop-driven, so there are no providers to mount today — the single place to
 * add one if a component ever needs context in a test.
 */
const Providers = ({ children }: { children: ReactNode }) => <>{children}</>;

type TRenderOpts = Omit<RenderOptions, 'wrapper'>;

/**
 * Bind a component + its default props once, get a `setup(overrides?)` renderer.
 * `setup()` renders with the defaults; `setup({ prop })` overrides just that
 * prop. Define `setup` once per test file.
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
 * Provider-wrapped direct render for the rare test that renders ad-hoc JSX or
 * multiple elements rather than one component + props.
 */
export const renderElement = (
  ui: ReactElement,
  options?: TRenderOpts,
): RenderResult => rtlRender(ui, { wrapper: Providers, ...options });

// Re-export the full RTL surface so tests import screen/fireEvent/etc. from here.
export * from '@testing-library/react';
