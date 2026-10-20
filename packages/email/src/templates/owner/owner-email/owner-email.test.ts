import { PLATFORM_EMAIL_BRAND } from '@blog/email/html/platform-email-brand/platform-email-brand';

import { buildOwnerEmail } from './owner-email';

describe(buildOwnerEmail, () => {
  describe('with copy and an action', () => {
    let email: ReturnType<typeof buildOwnerEmail>;

    beforeEach(() => {
      email = buildOwnerEmail({
        brandName: 'Inkwell',
        subject: 'Your site is ready',
        previewText: 'Acme Blog is live',
        paragraphs: ['Acme Blog is live.', 'Open it to start writing.'],
        action: {
          label: 'Open your site',
          url: 'https://acme.example.com/welcome',
        },
      });
    });

    it('passes the subject through unchanged', () => {
      expect(email.subject).toBe('Your site is ready');
    });

    it('renders each paragraph as its own paragraph', () => {
      expect(email.html).toContain(
        '<p>Acme Blog is live.</p><p>Open it to start writing.</p>',
      );
    });

    it('renders the preview text in the preheader', () => {
      expect(email.html).toContain('Acme Blog is live</div>');
    });

    it('renders the action as a button in the platform palette', () => {
      expect(email.html).toContain('href="https://acme.example.com/welcome"');
      expect(email.html).toContain('Open your site');
      expect(email.html).toContain(
        `background-color:${PLATFORM_EMAIL_BRAND.brandPrimarySolid}`,
      );
    });

    it('names the brand in the shell', () => {
      expect(email.html).toContain(
        `&copy; ${new Date().getFullYear()} Inkwell`,
      );
    });
  });

  it('renders no action when none is given', () => {
    const { html } = buildOwnerEmail({
      brandName: 'Inkwell',
      subject: 'Heads up',
      paragraphs: ['Sanity has emailed you an invite.'],
    });

    expect(html).not.toContain('<a ');
  });

  it('escapes every caller-supplied value', () => {
    const unsafe = '<script>alert(1)</script>';
    const { html } = buildOwnerEmail({
      brandName: unsafe,
      subject: unsafe,
      previewText: unsafe,
      paragraphs: [unsafe],
      action: { label: unsafe, url: 'https://example.com' },
    });

    expect(html).not.toContain(unsafe);
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('percent-encodes an unsafe action url', () => {
    const { html } = buildOwnerEmail({
      brandName: 'Inkwell',
      subject: 'Your site is ready',
      paragraphs: ['Acme Blog is live.'],
      action: {
        label: 'Open your site',
        url: `https://example.com/?q="><img src=x onerror=alert(1)>`,
      },
    });

    expect(html).not.toContain('"><img src=x onerror=alert(1)>');
    expect(html).toContain('%22%3E%3Cimg%20src=x%20onerror=alert(1)%3E');
  });
});
