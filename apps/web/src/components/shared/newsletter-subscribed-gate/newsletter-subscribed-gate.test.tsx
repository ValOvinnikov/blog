import { faker } from '@faker-js/faker';
import { customRender, screen } from '@web/testing/custom-render';
import { NEWSLETTER_SUBSCRIBED_COOKIE_NAME } from '@web/utils/newsletter-subscribed-cookie-name';

import { useIsReaderSubscribed } from './hooks/use-is-reader-subscribed';
import { NewsletterSubscribedGate } from './newsletter-subscribed-gate';

vi.mock(
  '@web/components/shared/newsletter-subscribed-gate/hooks/use-is-reader-subscribed',
);

faker.seed(6007);

const MOCK_CHILD_TEXT = faker.lorem.sentence();
const SUBSCRIBED_COOKIE = `${NEWSLETTER_SUBSCRIBED_COOKIE_NAME}=1`;

const setup = customRender(NewsletterSubscribedGate, {
  children: <p>{MOCK_CHILD_TEXT}</p>,
});

describe(`<${NewsletterSubscribedGate.name}/>`, () => {
  afterEach(() => {
    document.cookie = `${NEWSLETTER_SUBSCRIBED_COOKIE_NAME}=; Max-Age=0; Path=/`;
    vi.mocked(useIsReaderSubscribed).mockReset();
  });

  it.each([
    ['a signed-out visitor without the cookie', () => {}],
    [
      'a signed-in reader who is not subscribed, whatever the cookie says',
      () => {
        vi.mocked(useIsReaderSubscribed).mockReturnValue(false);
        document.cookie = SUBSCRIBED_COOKIE;
      },
    ],
  ])('renders its children for %s', (_, arrange) => {
    arrange();
    setup();

    const child = screen.getByText(MOCK_CHILD_TEXT);

    expect(child).toBeVisible();
  });

  it.each([
    [
      'a signed-out visitor with the cookie',
      () => {
        document.cookie = SUBSCRIBED_COOKIE;
      },
    ],
    [
      'a signed-in reader who is subscribed, whatever the cookie says',
      () => {
        vi.mocked(useIsReaderSubscribed).mockReturnValue(true);
      },
    ],
  ])('renders nothing for %s', (_, arrange) => {
    arrange();
    setup();

    const child = screen.queryByText(MOCK_CHILD_TEXT);

    expect(child).not.toBeInTheDocument();
  });

  it('keeps its children visible when the cookie is set after first render', () => {
    const { rerender } = setup();

    document.cookie = SUBSCRIBED_COOKIE;
    rerender(
      <NewsletterSubscribedGate>
        <p>{MOCK_CHILD_TEXT}</p>
      </NewsletterSubscribedGate>,
    );

    const child = screen.getByText(MOCK_CHILD_TEXT);
    expect(child).toBeVisible();
  });
});
