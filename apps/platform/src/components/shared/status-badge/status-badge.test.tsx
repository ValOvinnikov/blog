import { render, screen } from '@platform/testing/custom-render';

import { StatusBadge } from './status-badge';

describe(StatusBadge, () => {
  describe('with the ok tone', () => {
    beforeEach(() => {
      render(<StatusBadge tone="ok">Active</StatusBadge>);
    });

    it('renders its label', () => {
      expect(screen.getByText('Active')).toBeVisible();
    });

    it('renders the tone dot by default', () => {
      expect(screen.getByTestId('status-badge-dot')).toBeVisible();
    });
  });

  it('renders every tone without throwing', () => {
    const tones = ['ok', 'warn', 'bad', 'neutral', 'brand', 'plan'] as const;
    for (const tone of tones) {
      expect(() =>
        render(<StatusBadge tone={tone}>Label</StatusBadge>),
      ).not.toThrow();
    }
  });

  it('omits the tone dot when hasDot is false', () => {
    render(
      <StatusBadge tone="plan" hasDot={false}>
        Pro plan
      </StatusBadge>,
    );
    expect(screen.getByText('Pro plan')).toBeVisible();
    expect(screen.queryByTestId('status-badge-dot')).not.toBeInTheDocument();
  });
});
