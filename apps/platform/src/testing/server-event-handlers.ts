import { renderHookWithIntl } from '@platform/testing/custom-render';
import { isValidElement, type ReactNode } from 'react';

type TElementProps = Record<string, unknown> & { children?: ReactNode };
type TServerComponent = (props: TElementProps) => ReactNode;

const collectEventHandlers = (node: ReactNode, found: string[]): void => {
  if (Array.isArray(node)) {
    node.forEach((child: ReactNode) => collectEventHandlers(child, found));
    return;
  }
  if (!isValidElement<TElementProps>(node)) return;

  const { type, props } = node;
  if (typeof type === 'function') {
    collectEventHandlers((type as TServerComponent)(props), found);
    return;
  }

  const elementName = typeof type === 'string' ? type : 'ClientComponent';
  Object.entries(props).forEach(([propName, value]) => {
    if (propName !== 'children' && typeof value === 'function') {
      found.push(`${elementName}.${propName}`);
    }
  });
  collectEventHandlers(props.children, found);
};

/** The props React's server renderer would reject as event handlers passed across the client boundary. */
export const findServerEventHandlers = (ui: ReactNode): string[] =>
  renderHookWithIntl(() => {
    const found: string[] = [];
    collectEventHandlers(ui, found);
    return found;
  }).result.current;
