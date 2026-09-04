import { BRAND_VARIANT, CONTAINER_WIDTH, HEADING_ALIGN } from '@blog/config';
import { makeRawTaxonomyListModule } from '@blog/service/testing/modules/fixtures';

import { toTaxonomyListModule } from './transformer';

describe('toTaxonomyListModule', () => {
  it('maps brandVariant straight through', () => {
    const raw = makeRawTaxonomyListModule({
      brandVariant: BRAND_VARIANT.SECONDARY,
    });

    const module = toTaxonomyListModule(raw, []);

    expect(module.brandVariant).toBe(BRAND_VARIANT.SECONDARY);
  });

  it('maps sectionHeader when authored', () => {
    const raw = makeRawTaxonomyListModule({
      sectionHeader: {
        heading: 'Browse by topic',
        supportingText: 'Pick a subject.',
      },
    });

    const module = toTaxonomyListModule(raw, []);

    expect(module.sectionHeader).toEqual({
      heading: 'Browse by topic',
      supportingText: 'Pick a subject.',
    });
  });

  it('leaves every sectionHeader field undefined when unset (no faked default)', () => {
    const raw = makeRawTaxonomyListModule({ sectionHeader: null });

    const module = toTaxonomyListModule(raw, []);

    expect(module.sectionHeader).toEqual({
      heading: undefined,
      supportingText: undefined,
    });
  });

  it('leaves contentAlignment undefined when unset (no faked default)', () => {
    const raw = makeRawTaxonomyListModule({ contentAlignment: null });

    const module = toTaxonomyListModule(raw, []);

    expect(module.contentAlignment).toBeUndefined();
  });

  it('maps contentAlignment when authored', () => {
    const raw = makeRawTaxonomyListModule({
      contentAlignment: HEADING_ALIGN.CENTER,
    });

    const module = toTaxonomyListModule(raw, []);

    expect(module.contentAlignment).toBe(HEADING_ALIGN.CENTER);
  });

  it('maps a fully-authored layout object 1:1', () => {
    const raw = makeRawTaxonomyListModule({
      layout: {
        spacingTop: 'MD',
        spacingBottom: 'MD',
        containerWidth: CONTAINER_WIDTH.WIDE,
        dividerTop: true,
        dividerBottom: true,
      },
    });

    const module = toTaxonomyListModule(raw, []);

    expect(module.layout).toEqual({
      spacingTop: 'MD',
      spacingBottom: 'MD',
      containerWidth: CONTAINER_WIDTH.WIDE,
      dividerTop: true,
      dividerBottom: true,
    });
  });

  it('leaves layout undefined when unset (no faked default)', () => {
    const raw = makeRawTaxonomyListModule({ layout: null });

    const module = toTaxonomyListModule(raw, []);

    expect(module.layout).toBeUndefined();
  });

  it('passes the composed entries through untouched', () => {
    const raw = makeRawTaxonomyListModule();
    const entries = [
      {
        id: 'topic-1',
        title: 'Engineering',
        slug: 'engineering',
        description: undefined,
        postCount: 3,
      },
    ];

    const module = toTaxonomyListModule(raw, entries);

    expect(module.entries).toBe(entries);
  });
});
