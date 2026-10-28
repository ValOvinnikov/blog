import { LOCALE_BCP47_TAGS } from '@blog/config';
import { faker } from '@faker-js/faker';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import GlobalError from './global-error';

faker.seed(6192);

const MOCK_ERROR = Object.assign(new Error(faker.lorem.sentence()), {
  digest: faker.string.alphanumeric(10),
});

const setup = () => {
  const retry = vi.fn();

  render(<GlobalError error={MOCK_ERROR} retry={retry} />, {
    container: document,
  });

  return { retry };
};

describe(`<${GlobalError.name}/>`, () => {
  it('owns an English document', () => {
    setup();

    expect(document.documentElement).toHaveAttribute(
      'lang',
      LOCALE_BCP47_TAGS.EN,
    );
  });

  it('renders a single page heading without the app layout', () => {
    setup();

    const headings = screen.getAllByRole('heading', { level: 1 });

    expect(headings).toHaveLength(1);
  });

  it('retries the render from its one action', async () => {
    const user = userEvent.setup();
    const { retry } = setup();

    await user.click(screen.getByRole('button'));

    expect(retry).toHaveBeenCalledOnce();
  });
});
