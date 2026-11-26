import { isNull } from '@shinefold/utils/primitives';
import {
  act,
  render as rtlRender,
  type RenderOptions,
  type RenderResult,
} from '@testing-library/react';
import { AppProviders } from '@web/testing/providers';
import {
  cloneElement,
  createElement,
  Fragment,
  isValidElement,
  type ComponentType,
  type ReactElement,
  type ReactNode,
} from 'react';

const Providers = AppProviders;

type TRenderOpts = Omit<RenderOptions, 'wrapper'>;

const renderSettled = async (
  ui: ReactElement,
  options?: TRenderOpts,
): Promise<RenderResult> => {
  let result!: RenderResult;
  await act(async () => {
    result = rtlRender(ui, { wrapper: Providers, ...options });
  });
  return result;
};

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

/** Awaits only the top-level component; use `customRenderServerAsync` when its tree nests async Server Components. */
export const customRenderAsync = <P extends object>(
  Component: (props: P) => Promise<ReactNode>,
  defaultProps: NoInfer<P>,
) => {
  return async (
    overrides?: Partial<P>,
    options?: TRenderOpts,
  ): Promise<RenderResult> => {
    const ui = await Component({ ...defaultProps, ...overrides });
    return renderSettled(<>{ui}</>, options);
  };
};

type TAsyncComponent = (props: object) => Promise<ReactNode>;

type TElementWithStore = ReactElement & { _store?: { validated: number } };

// React's dev build flags static JSX children as key-checked on `_store`;
// a rebuilt element starts unflagged and would warn as an unkeyed list item.
const keepKeyValidation = (
  source: TElementWithStore,
  resolved: TElementWithStore,
): ReactElement => {
  if (source._store && resolved._store) {
    resolved._store.validated = source._store.validated;
  }
  return resolved;
};

const isAsyncComponent = (type: unknown): type is TAsyncComponent =>
  typeof type === 'function' && type.constructor.name === 'AsyncFunction';

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' &&
  !isNull(value) &&
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
      const resolved = (await resolveValue(
        await value.type(value.props),
      )) as ReactNode;
      return keepKeyValidation(
        value,
        createElement(Fragment, { key: value.key ?? undefined }, resolved),
      );
    }
    return keepKeyValidation(
      value,
      cloneElement(value, await resolveEntries(value.props)),
    );
  }
  if (isPlainObject(value)) return resolveEntries(value);
  return value;
};

const resolveServerTree = (node: ReactNode) =>
  resolveValue(node) as Promise<ReactNode>;

/** Awaits every nested async Server Component, props included, except one returned from a sync component's body. */
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
    return renderSettled(
      Wrapper ? <Wrapper>{ui}</Wrapper> : <>{ui}</>,
      options,
    );
  };
};

export const renderElement = (
  ui: ReactElement,
  options?: TRenderOpts,
): RenderResult => rtlRender(ui, { wrapper: Providers, ...options });

export * from '@testing-library/react';
