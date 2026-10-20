import { buildOwnerSiteReadyEmail } from './owner-site-ready';

describe(buildOwnerSiteReadyEmail, () => {
  it('renders the caller’s subject, escaped copy and action in the platform shell', () => {
    const email = buildOwnerSiteReadyEmail({
      brandName: 'Inkwell',
      subject: 'Your site is ready',
      paragraphs: ['<Acme Blog> is live.'],
      action: {
        label: 'Open your site',
        url: 'https://acme.example.com/welcome',
      },
    });

    expect(email.subject).toBe('Your site is ready');
    expect(email.html).toContain('&lt;Acme Blog&gt; is live.');
    expect(email.html).toContain('href="https://acme.example.com/welcome"');
    expect(email.html).toContain('Open your site');
  });
});
