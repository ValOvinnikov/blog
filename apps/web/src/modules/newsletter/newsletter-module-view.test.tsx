import { BRAND_VARIANT, NEWSLETTER_VARIANT } from '@blog/config';
import { customRender, screen } from '@web/testing/custom-render';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

import { NewsletterModuleView } from './newsletter-module-view';

vi.mock('@web/server/newsletter/newsletter-actions/newsletter-actions', () => ({
  subscribeToNewsletterAction: vi.fn(),
}));

const setup = customRender(NewsletterModuleView, {
  id: 'newsletter-1',
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: makeHeadingBlock({
    heading: 'Get new posts',
    supportingText: 'Straight to inbox.',
  }),
  variant: NEWSLETTER_VARIANT.FULL,
  layout: undefined,
  contentAlignment: undefined,
  trustCues: ['No spam', 'Unsubscribe anytime'],
});

describe(`<${NewsletterModuleView.name}/>`, () => {
  afterEach(() => {
    document.cookie =
      'newsletter_subscribed=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  });

  it('renders the full signup with the authored heading and supporting text', () => {
    setup();

    expect(
      screen.getByRole('heading', { name: 'Get new posts' }),
    ).toBeVisible();
    expect(screen.getByText('Straight to inbox.')).toBeVisible();
    expect(
      screen.getByRole('textbox', { name: 'Email address' }),
    ).toBeVisible();
  });

  it('labels the section landmark by the rendered heading', () => {
    setup();

    expect(screen.getByRole('region', { name: 'Get new posts' })).toBeVisible();
  });

  it('renders the authored trust cues for a FULL module', () => {
    setup();

    expect(screen.getByText('No spam')).toBeVisible();
    expect(screen.getByText('Unsubscribe anytime')).toBeVisible();
  });

  it('renders a COMPACT module without supporting text or trust cues', () => {
    setup({ variant: NEWSLETTER_VARIANT.COMPACT });

    expect(screen.getByText('Get new posts')).toBeVisible();
    expect(screen.queryByText('Straight to inbox.')).not.toBeInTheDocument();
    expect(screen.queryByText('No spam')).not.toBeInTheDocument();
  });

  it('renders no trust cues when the tenant never authored any', () => {
    setup({ trustCues: undefined });

    expect(screen.queryByText('No spam')).not.toBeInTheDocument();
  });

  it('renders neither the band nor the form for a reader with the subscribed cookie', () => {
    document.cookie = 'newsletter_subscribed=1';

    setup();

    expect(
      screen.queryByTestId('newsletter-module-newsletter-1'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('textbox', { name: 'Email address' }),
    ).not.toBeInTheDocument();
  });

  it('renders the band and the form together on first render without the cookie', () => {
    setup();

    expect(screen.getByTestId('newsletter-module-newsletter-1')).toBeVisible();
    expect(
      screen.getByRole('textbox', { name: 'Email address' }),
    ).toBeVisible();
  });
});
