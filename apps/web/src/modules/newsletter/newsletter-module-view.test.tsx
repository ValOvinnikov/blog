import {
  BRAND_VARIANT,
  CONTENT_ALIGNMENT,
  NEWSLETTER_VARIANT,
} from '@blog/config';
import { NewsletterForm } from '@web/components/shared/newsletter-form';
import { customRender, screen } from '@web/testing/custom-render';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

import { NewsletterModuleView } from './newsletter-module-view';

vi.mock('@web/server/newsletter/newsletter-actions', () => ({
  subscribeToNewsletterAction: vi.fn(),
}));

// Wraps the real implementation (so every other assertion in this file keeps
// exercising actual render behaviour) purely to observe the props it is
// called with — never its own rendered output.
vi.mock('@web/components/shared/newsletter-form', async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import('@web/components/shared/newsletter-form')
    >();
  return {
    ...actual,
    NewsletterForm: vi.fn(actual.NewsletterForm),
  };
});

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

  it('renders NewsletterForm with variant="full" for a FULL module', () => {
    setup();

    expect(vi.mocked(NewsletterForm)).toHaveBeenLastCalledWith(
      expect.objectContaining({ variant: 'full' }),
      undefined,
    );
  });

  it('renders NewsletterForm with variant="compact" for a COMPACT module', () => {
    setup({ variant: NEWSLETTER_VARIANT.COMPACT });

    expect(vi.mocked(NewsletterForm)).toHaveBeenLastCalledWith(
      expect.objectContaining({ variant: 'compact' }),
      undefined,
    );
  });

  it('passes contentAlignment through to NewsletterForm as align', () => {
    setup({ contentAlignment: CONTENT_ALIGNMENT.CENTER });

    expect(vi.mocked(NewsletterForm)).toHaveBeenLastCalledWith(
      expect.objectContaining({ align: CONTENT_ALIGNMENT.CENTER }),
      undefined,
    );
  });

  it('passes the CMS-authored trustCues through to NewsletterForm unchanged', () => {
    setup();

    expect(vi.mocked(NewsletterForm)).toHaveBeenLastCalledWith(
      expect.objectContaining({
        trustCues: ['No spam', 'Unsubscribe anytime'],
      }),
      undefined,
    );
  });

  it('passes trustCues through as undefined when the tenant never authored any', () => {
    setup({ trustCues: undefined });

    expect(vi.mocked(NewsletterForm)).toHaveBeenLastCalledWith(
      expect.objectContaining({ trustCues: undefined }),
      undefined,
    );
  });

  it('passes trustCues through as an empty array when the author cleared it', () => {
    setup({ trustCues: [] });

    expect(vi.mocked(NewsletterForm)).toHaveBeenLastCalledWith(
      expect.objectContaining({ trustCues: [] }),
      undefined,
    );
  });
});
