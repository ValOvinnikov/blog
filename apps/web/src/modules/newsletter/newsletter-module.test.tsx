import { customRenderAsync, screen } from '@web/testing/custom-render';

import { NewsletterModule } from './newsletter-module';

const { getNewsletterMock } = vi.hoisted(() => ({
  getNewsletterMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    modules: {
      newsletter: { v1: { getNewsletter: getNewsletterMock } },
    },
  },
}));

// `NewsletterForm` imports the real `newsletter-actions.ts` otherwise, which
// reads a server-only env var at module scope — mocked wholesale here (no
// assertions in this file exercise the newsletter submit flow itself; see
// `newsletter-form.test.tsx` for those).
vi.mock('@web/server/newsletter/newsletter-actions', () => ({
  subscribeToNewsletterAction: vi.fn(),
}));

const setup = customRenderAsync(NewsletterModule, {
  id: 'newsletter-1',
  locale: 'en',
});

describe(NewsletterModule, () => {
  beforeEach(() => {
    getNewsletterMock.mockReset();
  });

  it('renders nothing when the fetch fails', async () => {
    getNewsletterMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the CMS-authored heading and description', async () => {
    getNewsletterMock.mockResolvedValue({
      ok: true,
      data: { heading: 'Join the list', description: 'Fresh posts, no spam.' },
    });

    await setup();

    expect(
      screen.getByRole('heading', { name: 'Join the list' }),
    ).toBeVisible();
    expect(screen.getByText('Fresh posts, no spam.')).toBeVisible();
  });

  it('falls back to default copy when heading/description are left empty', async () => {
    getNewsletterMock.mockResolvedValue({
      ok: true,
      data: { heading: undefined, description: undefined },
    });

    await setup();

    expect(
      screen.getByRole('heading', { name: 'Get new posts by email' }),
    ).toBeVisible();
    expect(
      screen.getByText(
        'Subscribe to get new posts and updates delivered straight to your inbox.',
      ),
    ).toBeVisible();
  });
});
