import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

import { TerminalChip } from './terminal-chip';

faker.seed(123);

const setup = customRender(TerminalChip, {
  prefix: faker.word.noun(),
});

describe(`<${TerminalChip.name}/>`, () => {
  it('renders the wordmark from prefix/suffix', () => {
    const prefix = faker.word.noun();
    const suffix = faker.word.noun();
    setup({ prefix, suffix });
    expect(screen.getByText(`${prefix}${suffix}`)).toBeVisible();
  });

  it('renders a blinking cursor by default', () => {
    const { container } = setup();
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(2);
  });

  it('omits the cursor when showCursor is false', () => {
    const { container } = setup({ showCursor: false });
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(1);
  });

  it('exposes no accessible role or name', () => {
    setup();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
