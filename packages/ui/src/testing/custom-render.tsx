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

/** The library is pure and prop-driven, so there are no providers to mount today; this is the place to add one if a component ever needs context in a test. */
const Providers = ({ children }: { children: ReactNode }) => <>{children}</>;

type TRenderOpts = Omit<RenderOptions, 'wrapper'>;

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

export const renderElement = (
  ui: ReactElement,
  options?: TRenderOpts,
): RenderResult => rtlRender(ui, { wrapper: Providers, ...options });

// Re-export the full RTL surface so tests import screen/fireEvent/etc. from here.
export * from '@testing-library/react';
