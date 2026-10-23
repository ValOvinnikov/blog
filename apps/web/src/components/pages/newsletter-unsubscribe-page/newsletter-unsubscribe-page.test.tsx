import { LOCALE_ISO_CODES, routes } from '@blog/config';
import { getRequestContext } from '@web/server/request-context/request-context';
import { customRenderServerAsync, screen } from '@web/testing/custom-render';
import { MOCK_REQUEST_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { NewsletterUnsubscribePage } from './newsletter-unsubscribe-page';

vi.mock('@web/server/request-context/request-context');

const setup = customRenderServerAsync(NewsletterUnsubscribePage, {});

describe(`<${NewsletterUnsubscribePage.name}/>`, () => {
  beforeEach(async () => {
    vi.mocked(getRequestContext).mockResolvedValueOnce({
      ...MOCK_REQUEST_CONTEXT,
      locale: LOCALE_ISO_CODES.FR,
    });
    await setup();
  });

  it('asks the reader to confirm, with a link home', () => {
    const heading = screen.getByRole('heading', {
      level: 1,
      name: 'Unsubscribe from our newsletter',
    });
    const message = screen.getByText(
      'Click the button below to confirm you no longer want to receive newsletter emails from us.',
    );
    const homeLink = screen.getByRole('link', { name: 'Return home' });

    expect(heading).toBeVisible();
    expect(message).toBeVisible();
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('posts to the page-language unsubscribe endpoint with no token in the URL', () => {
    const form = screen.getByTestId('newsletter-unsubscribe-form');
    const button = screen.getByRole('button', { name: 'Confirm unsubscribe' });

    expect(form).toContainElement(button);
    expect(button).toHaveAttribute('type', 'submit');
    expect(form).toHaveAttribute('method', 'post');
    expect(form).toHaveAttribute(
      'action',
      routes.newsletterUnsubscribeSubmit(LOCALE_ISO_CODES.FR),
    );
  });
});
