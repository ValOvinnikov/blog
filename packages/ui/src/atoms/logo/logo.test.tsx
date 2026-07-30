import { customRender, screen } from '@blog/ui/testing/custom-render';

import { Logo } from './logo';

const setup = customRender(Logo, { prefix: 'Val.' });

describe(`<${Logo.name}/>`, () => {
  it('renders prefix text', () => {
    setup();
    expect(screen.getByText('Val.')).toBeVisible();
  });

  it('renders suffix when provided', () => {
    setup({ suffix: 'dev' });
    expect(screen.getByText('dev')).toBeVisible();
  });

  it('renders without suffix span when suffix is omitted', () => {
    const { container } = setup();
    // root span only; no nested span for suffix
    const spans = container.querySelectorAll('span');
    expect(spans).toHaveLength(1);
  });
});
