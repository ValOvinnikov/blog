import { renderIcon } from '@cms/structure/grouped-list-pane';
import { createElement, isValidElement, type ReactElement } from 'react';

describe(renderIcon, () => {
  it('returns null when no icon is given', () => {
    expect(renderIcon(undefined)).toBeNull();
  });

  it('passes an already-rendered element through unchanged', () => {
    const element = createElement('svg');

    expect(renderIcon(element)).toBe(element);
  });

  it('passes a string icon through unchanged', () => {
    expect(renderIcon('icon-name')).toBe('icon-name');
  });

  it('instantiates a plain function component', () => {
    const Icon = () => null;

    const result = renderIcon(Icon);

    expect(isValidElement(result)).toBe(true);
    expect((result as ReactElement).type).toBe(Icon);
  });

  it('instantiates a forwardRef-shaped component instead of returning it raw', () => {
    // lucide-react icons (and any React.forwardRef/React.memo component) are
    // objects shaped { $$typeof, render } — typeof is 'object', not
    // 'function' — so a `typeof icon === 'function'` check alone misses them.
    const ForwardRefIcon = {
      $$typeof: Symbol.for('react.forward_ref'),
      render: () => null,
    };

    const result = renderIcon(ForwardRefIcon as never);

    expect(isValidElement(result)).toBe(true);
    expect((result as ReactElement).type).toBe(ForwardRefIcon);
    // Guards the exact bug: the raw object must never be handed to React
    // directly as a child (that throws "Objects are not valid as a React
    // child (found: object with keys {$$typeof, render})").
    expect(result).not.toBe(ForwardRefIcon);
  });
});
