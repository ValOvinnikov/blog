import {
  Children,
  type ComponentProps,
  type ElementType,
  Fragment,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';

type TComponentMap = Record<string, ElementType>;

interface ICompoundSlots<M extends TComponentMap> {
  slots: { [K in keyof M]?: ReactElement };
  unmatched: ReactNode[];
}

/**
 * Flattens `children` into a plain array, descending into `<>...</>`
 * Fragments — unlike `Children.forEach`/`Children.toArray`, which treat a
 * Fragment as one opaque child (common when `children` is built as a single
 * JSX expression, e.g. Storybook `args`). Drops `null`/`false`/`undefined`.
 */
export const flattenChildren = (children: ReactNode): ReactNode[] => {
  const flat: ReactNode[] = [];
  Children.forEach(children, (child) => {
    if (isValidElement(child) && child.type === Fragment) {
      const fragmentProps = child.props as { children?: ReactNode };
      flat.push(...flattenChildren(fragmentProps.children));
    } else if (child != null && child !== false) {
      flat.push(child);
    }
  });
  return flat;
};

/**
 * Resolves a compound root's `children` against a map of known slot
 * components. Context-free — safe in Server Components. Anything that
 * doesn't match a known slot (unknown component, stray text, a duplicate
 * occurrence of an already-matched slot) is returned via `unmatched` instead
 * of being silently dropped.
 */
export const mapCompoundSlots = <M extends TComponentMap>(
  children: ReactNode,
  componentTypes: M,
): ICompoundSlots<M> => {
  const pairs = Object.entries(componentTypes) as [keyof M, ElementType][];
  const slots: ICompoundSlots<M>['slots'] = {};
  const unmatched: ReactNode[] = [];

  flattenChildren(children).forEach((child) => {
    if (!isValidElement(child)) {
      unmatched.push(child);
      return;
    }
    const match = pairs.find(
      ([key, Component]) =>
        child.type === Component && slots[key] === undefined,
    );
    if (match) slots[match[0]] = child;
    else unmatched.push(child);
  });

  return { slots, unmatched };
};

/** A compound component: its root intersected with its named slot sub-components. */
export type TCompoundComponent<
  Root extends ElementType,
  Parts extends Record<string, ElementType>,
> = Root & Parts;

type TSlotElement<Parts extends Record<string, ElementType>> = {
  [K in keyof Parts]: ReactElement<ComponentProps<Parts[K]>, Parts[K]>;
}[keyof Parts];

/** Strictly types a compound root's `children` to its own known slots. */
type TMaybeSlotElement<Parts extends Record<string, ElementType>> =
  TSlotElement<Parts> | false | null | undefined;

export type TCompoundChildren<Parts extends Record<string, ElementType>> =
  TMaybeSlotElement<Parts> | TMaybeSlotElement<Parts>[];
