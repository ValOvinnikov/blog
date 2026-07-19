import { faker } from '@faker-js/faker';
import { render, screen } from '@testing-library/react';

import { TerminalTyping } from './terminal-typing';

faker.seed(123);

describe(`<${TerminalTyping.name}/>`, () => {
  it('renders the full text in its final typed-out state', () => {
    const text = faker.word.words(2);
    render(<TerminalTyping text={text} />);
    expect(screen.getByText(text)).toBeVisible();
  });

  it('renders a blinking cursor by default', () => {
    const { container } = render(<TerminalTyping text={faker.word.noun()} />);
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(1);
  });

  it('omits the cursor when showCursor is false', () => {
    const { container } = render(
      <TerminalTyping text={faker.word.noun()} showCursor={false} />,
    );
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(0);
  });
});
