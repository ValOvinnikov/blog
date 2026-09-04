import { BRAND_VARIANT, HEADING_ALIGN } from '@blog/config';
import { customRender, screen } from '@web/testing/custom-render';

import { NewsletterModuleView } from './newsletter-module-view';

vi.mock('@web/server/newsletter/newsletter-actions', () => ({
  subscribeToNewsletterAction: vi.fn(),
}));

const setup = customRender(NewsletterModuleView, {
  id: 'newsletter-1',
  brandVariant: BRAND_VARIANT.PRIMARY,
  sectionHeader: {
    heading: 'Get new posts',
    supportingText: 'Straight to inbox.',
  },
  layout: undefined,
  contentAlignment: undefined,
});

describe(NewsletterModuleView, () => {
  afterEach(() => {
    document.cookie =
      'newsletter_subscribed=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  });

  it('renders the full newsletter signup with the CMS-authored heading/supportingText', () => {
    setup();

    expect(screen.getByText('Get new posts')).toBeVisible();
    expect(screen.getByText('Straight to inbox.')).toBeVisible();
  });

  it('resolves the Section landmark aria-labelledby to the rendered heading id', () => {
    const { container } = setup();

    const section = container.querySelector('section');
    const labelledBy = section?.getAttribute('aria-labelledby');

    expect(labelledBy).toBe('newsletter-newsletter-1');
    expect(document.getElementById(labelledBy ?? '')).toHaveTextContent(
      'Get new posts',
    );
  });

  it('renders the newsletter form as a direct child of Section, with no wrapping div', () => {
    setup();

    const wrapper = screen.getByTestId('newsletter-module-newsletter-1');
    expect(wrapper.tagName).toBe('SECTION');

    const inner = wrapper.firstElementChild;
    expect(inner?.children).toHaveLength(1);
  });

  it('passes contentAlignment through to NewsletterForm as align', () => {
    setup({ contentAlignment: HEADING_ALIGN.CENTER });

    const heading = screen.getByText('Get new posts');
    expect(heading.parentElement).toHaveClass('text-center');
  });
});
