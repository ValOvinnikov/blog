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
  slots: {
    [K in keyof M]?: ReactElement<ComponentProps<M[K]>, M[K]>;
  };
  unmatched: ReactNode[];
}

/** `Children.forEach` treats a `<>...</>` Fragment as one opaque child instead of descending into it, which this recurses past so `mapCompoundSlots` matches slots the same way regardless of Fragment wrapping. */
const flattenFragments = (children: ReactNode): ReactNode[] => {
  const flat: ReactNode[] = [];
  Children.forEach(children, (child) => {
    if (isValidElement(child) && child.type === Fragment) {
      const fragmentProps = child.props as { children?: ReactNode };
      flat.push(...flattenFragments(fragmentProps.children));
    } else {
      flat.push(child);
    }
  });
  return flat;
};

/** Anything that doesn't match a known slot is returned via `unmatched` instead of being silently dropped. */
export const mapCompoundSlots = <M extends TComponentMap>(
  children: ReactNode,
  componentTypes: M,
): ICompoundSlots<M> => {
  const pairs = Object.entries(componentTypes) as [keyof M, ElementType][];
  const slots: ICompoundSlots<M>['slots'] = {};
  const unmatched: ReactNode[] = [];

  flattenFragments(children).forEach((child) => {
    if (!isValidElement(child)) {
      if (child != null && child !== false) unmatched.push(child);
      return;
    }
    const match = pairs.find(
      ([key, Component]) =>
        child.type === Component && slots[key] === undefined,
    );
    if (match) {
      const [key] = match;
      slots[key] = child as ICompoundSlots<M>['slots'][typeof key];
    } else unmatched.push(child);
  });

  return { slots, unmatched };
};

export type TCompoundComponent<
  Root extends ElementType,
  Parts extends Record<string, ElementType>,
> = Root & Parts;

type TSlotElement<Parts extends Record<string, ElementType>> = {
  [K in keyof Parts]: ReactElement<ComponentProps<Parts[K]>, Parts[K]>;
}[keyof Parts];

type TMaybeSlotElement<Parts extends Record<string, ElementType>> =
  TSlotElement<Parts> | false | null | undefined;

export type TCompoundChildren<Parts extends Record<string, ElementType>> =
  TMaybeSlotElement<Parts> | TMaybeSlotElement<Parts>[];
