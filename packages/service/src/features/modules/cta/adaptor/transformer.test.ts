import { BRAND_VARIANT, CONTAINER_WIDTH, HEADING_ALIGN } from '@blog/config';
import { makeRawCtaModule } from '@blog/service/testing/modules/fixtures';

import { toCtaModule } from './transformer';

describe('toCtaModule', () => {
  it('maps sectionHeader and the resolved action link', () => {
    const raw = makeRawCtaModule();

    const cta = toCtaModule(raw);

    expect(cta.sectionHeader).toEqual({
      heading: 'Subscribe to the newsletter',
      supportingText: 'Get new posts in your inbox.',
      align: undefined,
    });
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

  it('leaves supportingText and align undefined when not set (no faked default)', () => {
    const raw = makeRawCtaModule({
      sectionHeader: {
        heading: 'Subscribe to the newsletter',
        supportingText: null,
        align: null,
      },
    });

    const cta = toCtaModule(raw);

    expect(cta.sectionHeader.supportingText).toBeUndefined();
    expect(cta.sectionHeader.align).toBeUndefined();
  });

  it('maps a fully-authored layout object 1:1', () => {
    const raw = makeRawCtaModule({
      layout: {
        spacingTop: 'LG',
        spacingBottom: 'SM',
        containerWidth: CONTAINER_WIDTH.NARROW,
        dividerTop: true,
        dividerBottom: false,
      },
    });

    const cta = toCtaModule(raw);

    expect(cta.layout).toEqual({
      spacingTop: 'LG',
      spacingBottom: 'SM',
      containerWidth: CONTAINER_WIDTH.NARROW,
      dividerTop: true,
      dividerBottom: false,
    });
  });

  it('leaves layout undefined when the field is unset (no faked default)', () => {
    const raw = makeRawCtaModule({ layout: null });

    const cta = toCtaModule(raw);

    expect(cta.layout).toBeUndefined();
  });

  it('maps sectionHeader.align when authored', () => {
    const raw = makeRawCtaModule({
      sectionHeader: {
        heading: 'Subscribe to the newsletter',
        supportingText: null,
        align: HEADING_ALIGN.CENTER,
      },
    });

    const cta = toCtaModule(raw);

    expect(cta.sectionHeader.align).toBe(HEADING_ALIGN.CENTER);
  });
});
