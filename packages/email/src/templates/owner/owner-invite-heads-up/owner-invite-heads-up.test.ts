import { buildOwnerInviteHeadsUpEmail } from './owner-invite-heads-up';

describe(buildOwnerInviteHeadsUpEmail, () => {
  it('renders the caller’s subject and escaped copy in the platform shell without an action', () => {
    const email = buildOwnerInviteHeadsUpEmail({
      brandName: 'Inkwell',
      subject: 'Check your inbox for a Sanity invite',
      paragraphs: ['Accept it with the account you’ll use <every day>.'],
    });

    expect(email.subject).toBe('Check your inbox for a Sanity invite');
    expect(email.html).toContain('<!doctype html>');
    expect(email.html).toContain('the account you’ll use &lt;every day&gt;.');
    expect(email.html).not.toContain('<a ');
  });
});
