import {
  BRAND_VARIANT,
  CONTAINER_WIDTH,
  CONTENT_ALIGNMENT,
  NEWSLETTER_VARIANT,
} from '@blog/config';
import { makeRawNewsletterModule } from '@blog/service/testing/modules/fixtures';
import { makeRawHeadingBlock } from '@blog/service/testing/shared/fixtures';

import { toNewsletterModule } from './transformer';

describe('toNewsletterModule', () => {
  it('maps headingBlock straight through', () => {
    const raw = makeRawNewsletterModule();

    const module = toNewsletterModule(raw);

    expect(module.headingBlock).toEqual({
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

  it('maps variant straight through', () => {
    const raw = makeRawNewsletterModule({
      variant: NEWSLETTER_VARIANT.COMPACT,
    });

    const module = toNewsletterModule(raw);

    expect(module.variant).toBe(NEWSLETTER_VARIANT.COMPACT);
  });

  it('leaves supportingText undefined when not set (no faked default)', () => {
    const raw = makeRawNewsletterModule({
      headingBlock: makeRawHeadingBlock({
        heading: 'Stay in the loop',
        supportingText: null,
      }),
    });

    const module = toNewsletterModule(raw);

    expect(module.headingBlock.supportingText).toBeUndefined();
  });

  it('leaves contentAlignment undefined when unset (no faked default)', () => {
    const raw = makeRawNewsletterModule({ contentAlignment: null });

    const module = toNewsletterModule(raw);

    expect(module.contentAlignment).toBeUndefined();
  });

  it('maps contentAlignment when authored', () => {
    const raw = makeRawNewsletterModule({
      contentAlignment: CONTENT_ALIGNMENT.CENTER,
    });

    const module = toNewsletterModule(raw);

    expect(module.contentAlignment).toBe(CONTENT_ALIGNMENT.CENTER);
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
