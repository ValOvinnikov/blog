import {
  render as rtlRender,
  type RenderOptions,
  type RenderResult,
} from '@testing-library/react';
import { AppProviders } from '@web/testing/providers';
import {
  cloneElement,
  createElement,
  isValidElement,
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
 * those (`<X> is an async Client Component`) — use `customRenderServerAsync`
 * for a tree with async children.
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

type TAsyncComponent = (props: object) => Promise<ReactNode>;

const isAsyncComponent = (type: unknown): type is TAsyncComponent =>
  typeof type === 'function' && type.constructor.name === 'AsyncFunction';

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' &&
  value !== null &&
  Object.getPrototypeOf(value) === Object.prototype;

const resolveEntries = async (
  record: Record<string, unknown>,
): Promise<Record<string, unknown>> =>
  Object.fromEntries(
    await Promise.all(
      Object.entries(record).map(
        async ([key, value]) => [key, await resolveValue(value)] as const,
      ),
    ),
  );

const resolveValue = async (value: unknown): Promise<unknown> => {
  if (Array.isArray(value)) return Promise.all(value.map(resolveValue));
  if (isValidElement<Record<string, unknown>>(value)) {
    if (isAsyncComponent(value.type)) {
      return resolveValue(await value.type(value.props));
    }
    return cloneElement(value, await resolveEntries(value.props));
  }
  if (isPlainObject(value)) return resolveEntries(value);
  return value;
};

const resolveServerTree = (node: ReactNode) =>
  resolveValue(node) as Promise<ReactNode>;

/**
 * `customRenderAsync` for a Server Component whose tree nests further async
 * Server Components: each one is awaited before RTL renders, the way the RSC
 * renderer resolves them, including those passed inside a plain-object prop.
 * Only `async` function components are called; sync ones render normally, so
 * an async component returned from inside a sync one's body is never reached.
 */
export const customRenderServerAsync = <P extends object>(
  Component: (props: P) => Promise<ReactNode>,
  defaultProps: NoInfer<P>,
  { wrapper: Wrapper }: Pick<RenderOptions, 'wrapper'> = {},
) => {
  return async (
    overrides?: Partial<P>,
    options?: TRenderOpts,
  ): Promise<RenderResult> => {
    const ui = await resolveServerTree(
      await Component({ ...defaultProps, ...overrides }),
    );
    return rtlRender(Wrapper ? <Wrapper>{ui}</Wrapper> : <>{ui}</>, {
      wrapper: Providers,
      ...options,
    });
  };
};

/** Provider-wrapped direct render for ad-hoc/pre-built JSX. */
export const renderElement = (
  ui: ReactElement,
  options?: TRenderOpts,
): RenderResult => rtlRender(ui, { wrapper: Providers, ...options });

// Re-export the full RTL surface so tests import screen/fireEvent/etc. from here.
export * from '@testing-library/react';
