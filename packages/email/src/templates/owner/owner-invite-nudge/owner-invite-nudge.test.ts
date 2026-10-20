import { buildOwnerInviteNudgeEmail } from './owner-invite-nudge';

describe(buildOwnerInviteNudgeEmail, () => {
  it('renders the caller’s subject, escaped copy and action in the platform shell', () => {
    const email = buildOwnerInviteNudgeEmail({
      brandName: 'Inkwell',
      subject: 'Your Sanity invite is still waiting',
      paragraphs: ['Accept it to start editing <Acme Blog>.'],
      action: {
        label: 'Check now',
        url: 'https://platform.example.com/dashboard',
      },
    });

    expect(email.subject).toBe('Your Sanity invite is still waiting');
    expect(email.html).toContain('editing &lt;Acme Blog&gt;.');
    expect(email.html).toContain(
      'href="https://platform.example.com/dashboard"',
    );
    expect(email.html).toContain('Check now');
  });
});
