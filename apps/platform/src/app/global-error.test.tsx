import { LOCALE_BCP47_TAGS } from '@blog/config';
import { faker } from '@faker-js/faker';
import { customRender, screen } from '@platform/testing/custom-render';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import GlobalError from './global-error';

faker.seed(6192);

const MOCK_ERROR = Object.assign(new Error(faker.lorem.sentence()), {
  digest: faker.string.alphanumeric(10),
});

const MOCK_RETRY = vi.fn();

const setup = customRender(GlobalError, {
  error: MOCK_ERROR,
  retry: MOCK_RETRY,
});

describe(`<${GlobalError.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    setup();
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
    const reloadButton = screen.getByRole('button', { name: 'Reload' });

    await user.click(reloadButton);

    expect(MOCK_RETRY).toHaveBeenCalledOnce();
  });
});
