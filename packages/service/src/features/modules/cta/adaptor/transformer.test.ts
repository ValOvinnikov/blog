import { ALIGN, BRAND_VARIANT, CONTAINER_WIDTH } from '@blog/config';
import { makeRawCtaModule } from '@blog/service/testing/modules/fixtures';

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
      ariaLabel: undefined,
    });
  });

  it('maps brandVariant straight through', () => {
    const raw = makeRawCtaModule({ brandVariant: BRAND_VARIANT.SECONDARY });

    const cta = toCtaModule(raw);

    expect(cta.brandVariant).toBe(BRAND_VARIANT.SECONDARY);
  });

  it('leaves text undefined when not set (no faked default)', () => {
    const raw = makeRawCtaModule({ text: null });

    const cta = toCtaModule(raw);

    expect(cta.text).toBeUndefined();
  });

  it('maps a fully-authored appearance object 1:1', () => {
    const raw = makeRawCtaModule({
      appearance: {
        spacingTop: 'LG',
        spacingBottom: 'SM',
        containerWidth: CONTAINER_WIDTH.NARROW,
        align: ALIGN.CENTER,
        divider: true,
      },
    });

    const cta = toCtaModule(raw);

    expect(cta.appearance).toEqual({
      spacingTop: 'LG',
      spacingBottom: 'SM',
      containerWidth: CONTAINER_WIDTH.NARROW,
      align: ALIGN.CENTER,
      divider: true,
    });
  });

  it('leaves appearance undefined when the field is unset (no faked default)', () => {
    const raw = makeRawCtaModule({ appearance: null });

    const cta = toCtaModule(raw);

    expect(cta.appearance).toBeUndefined();
  });
});
