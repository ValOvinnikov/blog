import { LOCALE_BCP47_TAGS } from '@blog/config';
import { faker } from '@faker-js/faker';
import { render, screen } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import GlobalError from './global-error';

faker.seed(6192);

const MOCK_ERROR = Object.assign(new Error(faker.lorem.sentence()), {
  digest: faker.string.alphanumeric(10),
});

describe(`<${GlobalError.name}/>`, () => {
  let user: UserEvent;
  const retry = vi.fn();

  beforeEach(() => {
    user = userEvent.setup();
    render(<GlobalError error={MOCK_ERROR} retry={retry} />, {
      container: document,
    });
  });

  it('owns an English document', () => {
    expect(document.documentElement).toHaveAttribute(
      'lang',
      LOCALE_BCP47_TAGS.EN,
    );
  });

  it('renders a single page heading without the app layout', () => {
    const headings = screen.getAllByRole('heading', { level: 1 });

    expect(headings).toHaveLength(1);
  });

  it('retries the render from its one action', async () => {
    const reloadButton = screen.getByRole('button');

    await user.click(reloadButton);

    expect(retry).toHaveBeenCalledOnce();
  });
});
