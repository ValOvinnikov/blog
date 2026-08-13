import {
  render as rtlRender,
  type RenderOptions,
  type RenderResult,
} from '@testing-library/react';
import type { ReactNode } from 'react';

type TRenderOpts = Omit<RenderOptions, 'wrapper'>;

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
    return rtlRender(<>{ui}</>, options);
  };
};

// Re-export the full RTL surface so tests import screen/fireEvent/etc. from here.
export * from '@testing-library/react';
