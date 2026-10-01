import {
  customRender,
  renderElement,
  screen,
} from '@web/testing/custom-render';

import { NewsletterSubscribedGate } from './newsletter-subscribed-gate';

const setup = customRender(NewsletterSubscribedGate, {
  children: <p>Subscribe here</p>,
});

describe(`<${NewsletterSubscribedGate.name}/>`, () => {
  afterEach(() => {
    document.cookie =
      'newsletter_subscribed=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  });

  it('renders its children when the subscribed cookie is absent', () => {
    setup();

    expect(screen.getByText('Subscribe here')).toBeVisible();
  });

  it('renders nothing when the subscribed cookie is present', () => {
    document.cookie = 'newsletter_subscribed=1';

    setup();

    expect(screen.queryByText('Subscribe here')).not.toBeInTheDocument();
  });

  it('keeps its children visible when the cookie is set after the first render', () => {
    const { rerender } = renderElement(
      <NewsletterSubscribedGate>
        <p>Subscribe here</p>
      </NewsletterSubscribedGate>,
    );

    document.cookie = 'newsletter_subscribed=1';
    rerender(
      <NewsletterSubscribedGate>
        <p>Subscribe here</p>
      </NewsletterSubscribedGate>,
    );

    expect(screen.getByText('Subscribe here')).toBeVisible();
  });
});
