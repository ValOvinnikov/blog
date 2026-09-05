import { BRAND_VARIANT, CONTAINER_WIDTH, HEADING_ALIGN } from '@blog/config';
import { makeRawNewsletterModule } from '@blog/service/testing/modules/fixtures';

import { toNewsletterModule } from './transformer';

describe('toNewsletterModule', () => {
  it('maps sectionHeader straight through', () => {
    const raw = makeRawNewsletterModule();

    const module = toNewsletterModule(raw);

    expect(module.sectionHeader).toEqual({
      heading: 'Stay in the loop',
      supportingText: 'Get new posts in your inbox.',
    });
  });

  it('maps brandVariant straight through', () => {
    const raw = makeRawNewsletterModule({
      brandVariant: BRAND_VARIANT.SECONDARY,
    });

    const module = toNewsletterModule(raw);

    expect(module.brandVariant).toBe(BRAND_VARIANT.SECONDARY);
  });

  it('leaves supportingText undefined when not set (no faked default)', () => {
    const raw = makeRawNewsletterModule({
      sectionHeader: {
        heading: 'Stay in the loop',
        supportingText: null,
      },
    });

    const module = toNewsletterModule(raw);

    expect(module.sectionHeader.supportingText).toBeUndefined();
  });

  it('leaves contentAlignment undefined when unset (no faked default)', () => {
    const raw = makeRawNewsletterModule({ contentAlignment: null });

    const module = toNewsletterModule(raw);

    expect(module.contentAlignment).toBeUndefined();
  });

  it('maps contentAlignment when authored', () => {
    const raw = makeRawNewsletterModule({
      contentAlignment: HEADING_ALIGN.CENTER,
    });

    const module = toNewsletterModule(raw);

    expect(module.contentAlignment).toBe(HEADING_ALIGN.CENTER);
  });

  it('maps a fully-authored layout object 1:1', () => {
    const raw = makeRawNewsletterModule({
      layout: {
        spacingTop: 'SM',
        spacingBottom: 'SM',
        containerWidth: CONTAINER_WIDTH.WIDE,
        dividerTop: false,
        dividerBottom: true,
      },
    });

    const module = toNewsletterModule(raw);

    expect(module.layout).toEqual({
      spacingTop: 'SM',
      spacingBottom: 'SM',
      containerWidth: CONTAINER_WIDTH.WIDE,
      dividerTop: false,
      dividerBottom: true,
    });
  });

  it('leaves layout undefined when the field is unset (no faked default)', () => {
    const raw = makeRawNewsletterModule({ layout: null });

    const module = toNewsletterModule(raw);

    expect(module.layout).toBeUndefined();
  });
});
