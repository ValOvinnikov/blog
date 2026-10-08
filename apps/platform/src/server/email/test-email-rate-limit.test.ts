import { takeTestEmailSend } from './test-email-rate-limit';

const START = 1_000_000;

describe(takeTestEmailSend, () => {
  it('allows five sends per admin in ten minutes, then refuses', () => {
    const allowed = Array.from({ length: 6 }, () =>
      takeTestEmailSend('admin-a', START),
    );

    expect(allowed).toEqual([true, true, true, true, true, false]);
  });

  it('counts each admin separately', () => {
    Array.from({ length: 5 }, () => takeTestEmailSend('admin-b', START));

    expect(takeTestEmailSend('admin-b', START)).toBe(false);
    expect(takeTestEmailSend('admin-c', START)).toBe(true);
  });

  it('allows sends again once the window has passed', () => {
    Array.from({ length: 5 }, () => takeTestEmailSend('admin-d', START));

    expect(takeTestEmailSend('admin-d', START + 10 * 60_000)).toBe(true);
  });
});
