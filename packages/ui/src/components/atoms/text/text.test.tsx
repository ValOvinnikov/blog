import { customRender, screen } from '@blog/ui/testing/custom-render';

import { Text } from './text';

const setup = customRender(Text, { children: 'Body text' });

describe(`<${Text.name}/>`, () => {
  it('renders children as a paragraph', () => {
    setup();
    expect(screen.getByText('Body text').tagName).toBe('P');
  });
});
