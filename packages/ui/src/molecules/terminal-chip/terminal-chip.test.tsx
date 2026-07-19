import { faker } from '@faker-js/faker';
import { render, screen } from '@testing-library/react';

import { TerminalChip } from './terminal-chip';

faker.seed(123);

describe(`<${TerminalChip.name}/>`, () => {
  it('renders the wordmark from prefix/suffix', () => {
    const prefix = faker.word.noun();
    const suffix = faker.word.noun();
    render(<TerminalChip prefix={prefix} suffix={suffix} />);
    expect(screen.getByText(`${prefix}${suffix}`)).toBeVisible();
  });

  it('renders a blinking cursor by default', () => {
    const { container } = render(<TerminalChip prefix={faker.word.noun()} />);
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(2);
  });

  it('omits the cursor when showCursor is false', () => {
    const { container } = render(
      <TerminalChip prefix={faker.word.noun()} showCursor={false} />,
    );
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(1);
  });

  it('exposes no accessible role or name', () => {
    render(<TerminalChip prefix={faker.word.noun()} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
