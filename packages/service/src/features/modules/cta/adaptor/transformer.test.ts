import { makeRawCtaModule } from '@blog/service/testing/modules/fixtures';
import { describe, expect, it } from 'vitest';

import { toCtaModule } from './transformer';

describe('toCtaModule', () => {
  it('maps heading, text, and the resolved action link', () => {
    const raw = makeRawCtaModule();

    const cta = toCtaModule(raw);

    expect(cta.heading).toBe('Subscribe to the newsletter');
    expect(cta.text).toBe('Get new posts in your inbox.');
    expect(cta.action).toEqual({
      label: 'Subscribe',
      href: '/newsletter',
      target: undefined,
      platform: undefined,
    });
  });

  it('leaves text undefined when not set (no faked default)', () => {
    const raw = makeRawCtaModule({ text: null });

    const cta = toCtaModule(raw);

    expect(cta.text).toBeUndefined();
  });
});
