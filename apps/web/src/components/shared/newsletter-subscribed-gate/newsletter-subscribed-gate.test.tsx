import { faker } from '@faker-js/faker';
import { customRender, screen } from '@web/testing/custom-render';
import { NEWSLETTER_SUBSCRIBED_COOKIE_NAME } from '@web/utils/newsletter-subscribed-cookie-name';

import { NewsletterSubscribedGate } from './newsletter-subscribed-gate';

faker.seed(6007);

const MOCK_CHILD_TEXT = faker.lorem.sentence();

const setup = customRender(NewsletterSubscribedGate, {
  children: <p>{MOCK_CHILD_TEXT}</p>,
});

describe(`<${NewsletterSubscribedGate.name}/>`, () => {
  afterEach(() => {
    document.cookie = `${NEWSLETTER_SUBSCRIBED_COOKIE_NAME}=; Max-Age=0; Path=/`;
  });

  it('renders its children when the subscribed cookie is absent', () => {
    setup();

    const child = screen.getByText(MOCK_CHILD_TEXT);

    expect(child).toBeVisible();
  });

  it('renders nothing when the subscribed cookie is present', () => {
    document.cookie = `${NEWSLETTER_SUBSCRIBED_COOKIE_NAME}=1`;

    setup();

    const child = screen.queryByText(MOCK_CHILD_TEXT);

    expect(child).not.toBeInTheDocument();
  });

  it('keeps its children visible when the cookie is set after first render', () => {
    const { rerender } = setup();

    document.cookie = `${NEWSLETTER_SUBSCRIBED_COOKIE_NAME}=1`;
    rerender(
      <NewsletterSubscribedGate>
        <p>{MOCK_CHILD_TEXT}</p>
      </NewsletterSubscribedGate>,
    );

    const child = screen.getByText(MOCK_CHILD_TEXT);
    expect(child).toBeVisible();
  });
});
