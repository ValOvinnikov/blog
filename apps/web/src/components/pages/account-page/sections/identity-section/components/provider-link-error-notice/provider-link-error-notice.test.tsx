import { faker } from '@faker-js/faker';
import { SITE_MESSAGES } from '@shinefold/config';
import { AUTH_ERROR_TYPE, AUTH_QUERY_PARAM } from '@web/constants/sign-in';
import { customRender, screen } from '@web/testing/custom-render';

import { ProviderLinkErrorNotice } from './provider-link-error-notice';

faker.seed(7747);

const { linkNotLinkedError, linkError } = SITE_MESSAGES.accountPage.identity;

const setup = customRender(ProviderLinkErrorNotice, {});

const setLocationSearch = (search: string) => {
  window.history.replaceState(null, '', `/${search}`);
};

describe(`<${ProviderLinkErrorNotice.name}/>`, () => {
  afterEach(() => {
    setLocationSearch('');
  });

  it.each([
    {
      title: 'a refused link',
      error: AUTH_ERROR_TYPE.OAUTH_ACCOUNT_NOT_LINKED,
      message: linkNotLinkedError,
    },
    {
      title: 'any other error',
      error: faker.string.alpha(12),
      message: linkError,
    },
  ])('explains $title', async ({ error, message }) => {
    setLocationSearch(`?${AUTH_QUERY_PARAM.ERROR}=${error}`);
    setup();

    const alert = await screen.findByRole('alert');

    expect(alert).toHaveTextContent(message);
  });

  it('shows nothing when the reader arrives without an error', () => {
    setup();

    const alert = screen.queryByRole('alert');

    expect(alert).not.toBeInTheDocument();
  });
});
