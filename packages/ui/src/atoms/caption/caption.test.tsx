import { customRender, screen } from '@blog/ui/testing/custom-render';

import { Caption } from './caption';

const setup = customRender(Caption, {});

describe(`<${Caption.name}/>`, () => {
  it('renders as a <figcaption> element', () => {
    const { container } = setup();
    expect(container.firstChild?.nodeName).toBe('FIGCAPTION');
  });

  it('renders children', () => {
    setup({ children: 'Photo by Jane Doe' });
    expect(screen.getByText('Photo by Jane Doe')).toBeVisible();
  });
});
