import {
  customRender,
  renderElement,
  screen,
} from '@blog/ui/testing/custom-render';

import { Text } from './text';

const setup = customRender(Text, { children: 'Body text' });

describe(`<${Text.name}/>`, () => {
  it('renders children as a paragraph', () => {
    setup();
    expect(screen.getByText('Body text').tagName).toBe('P');
  });

  it('renders with default lead variant when no variant is given', () => {
    setup({ children: 'Default' });
    expect(screen.getByText('Default').className).toContain('text-text');
  });

  it('hero variant applies muted color', () => {
    setup({ variant: 'hero', children: 'Subtitle' });
    expect(screen.getByText('Subtitle').className).toContain('text-muted');
  });

  it('card variant applies card-copy size', () => {
    setup({ variant: 'card', children: 'Excerpt' });
    expect(screen.getByText('Excerpt').className).toContain('text-card-copy');
  });

  it('muted variant applies muted color', () => {
    setup({ variant: 'muted', children: 'Muted body' });
    expect(screen.getByText('Muted body').className).toContain('text-muted');
  });

  it('lead variant applies text-text color', () => {
    setup({ variant: 'lead', children: 'Lead body' });
    expect(screen.getByText('Lead body').className).toContain('text-text');
  });

  it('forwards additional HTML attributes', () => {
    renderElement(<Text data-testid="text-el">Content</Text>);
    expect(screen.getByTestId('text-el')).toBeVisible();
  });
});
