import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

import { StatusBadge } from './status-badge';

faker.seed(123);

const label = faker.word.adjective();

const setup = customRender(StatusBadge, { tone: 'ok', children: label });

describe(`<${StatusBadge.name}/>`, () => {
  it('renders the given text', () => {
    setup();
    expect(screen.getByText(label)).toBeVisible();
  });

  it('renders with the ok tone', () => {
    setup({ tone: 'ok' });
    expect(screen.getByText(label)).toBeVisible();
  });

  it('renders with the warn tone', () => {
    setup({ tone: 'warn' });
    expect(screen.getByText(label)).toBeVisible();
  });

  it('renders with the neutral tone', () => {
    setup({ tone: 'neutral' });
    expect(screen.getByText(label)).toBeVisible();
  });

  it('forwards dataTestId to the root element', () => {
    setup({ dataTestId: 'status-badge' });
    expect(screen.getByTestId('status-badge')).toBeVisible();
  });

  it('accepts a className override on the root', () => {
    const { container } = setup({ className: 'custom-class' });
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
