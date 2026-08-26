import { render, screen } from '@admin/testing/custom-render';

import { StatusBadge } from './status-badge';

describe(StatusBadge, () => {
  it('renders its label', () => {
    render(<StatusBadge tone="ok">Active</StatusBadge>);
    expect(screen.getByText('Active')).toBeVisible();
  });

  it('renders every tone without throwing', () => {
    const tones = ['ok', 'warn', 'bad', 'neutral', 'plan'] as const;
    for (const tone of tones) {
      expect(() =>
        render(<StatusBadge tone={tone}>Label</StatusBadge>),
      ).not.toThrow();
    }
  });

  it('renders the tone dot by default', () => {
    const { container } = render(<StatusBadge tone="ok">Active</StatusBadge>);
    expect(container.querySelector('span[aria-hidden="true"]')).not.toBeNull();
  });

  it('omits the tone dot when hasDot is false', () => {
    const { container } = render(
      <StatusBadge tone="plan" hasDot={false}>
        Pro plan
      </StatusBadge>,
    );
    expect(screen.getByText('Pro plan')).toBeVisible();
    expect(container.querySelector('span[aria-hidden="true"]')).toBeNull();
  });
});
