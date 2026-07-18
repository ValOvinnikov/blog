import { render, screen } from '@testing-library/react';

import { TerminalChip } from './terminal-chip';

describe(`<${TerminalChip.name}/>`, () => {
  it('renders the fixed wordmark', () => {
    render(<TerminalChip />);
    expect(screen.getByText('BRAND')).toBeVisible();
  });

  it('renders a blinking cursor by default', () => {
    const { container } = render(<TerminalChip />);
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(2);
  });

  it('omits the cursor when showCursor is false', () => {
    const { container } = render(<TerminalChip showCursor={false} />);
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(1);
  });

  it('exposes no accessible role or name', () => {
    render(<TerminalChip />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('uses the Indigo accent token when variant is indigo', () => {
    const { container } = render(<TerminalChip variant="indigo" />);
    const [prompt, cursor] = container.querySelectorAll('[aria-hidden="true"]');
    expect(prompt).toHaveStyle({ color: 'var(--logo-alt-accent)' });
    expect(cursor).toHaveStyle({ backgroundColor: 'var(--logo-alt-accent)' });
  });
});
