import {
  makeRawFeatureHighlightItem,
  makeRawFeatureHighlightsModule,
} from '@blog/service/testing/modules/fixtures';

import { featureHighlightsModuleQuery } from './query';

describe('featureHighlightsModuleQuery', () => {
  it('filters to module_featureHighlights documents by id', () => {
    expect(featureHighlightsModuleQuery.query).toContain(
      '_type == "module_featureHighlights"',
    );
    expect(featureHighlightsModuleQuery.query).toContain('_id == $id');
  });

  it('rejects a module with no headingBlock', () => {
    const raw = { ...makeRawFeatureHighlightsModule(), headingBlock: null };

    expect(() => featureHighlightsModuleQuery.parse(raw)).toThrow();
  });

  it('rejects a module with no highlights', () => {
    const raw = { ...makeRawFeatureHighlightsModule(), highlights: null };

    expect(() => featureHighlightsModuleQuery.parse(raw)).toThrow();
  });

  it('rejects a highlight with no heading', () => {
    const raw = {
      ...makeRawFeatureHighlightsModule(),
      highlights: [{ ...makeRawFeatureHighlightItem(), heading: null }],
    };

    expect(() => featureHighlightsModuleQuery.parse(raw)).toThrow();
  });

  it('rejects a highlight with no body', () => {
    const raw = {
      ...makeRawFeatureHighlightsModule(),
      highlights: [{ ...makeRawFeatureHighlightItem(), body: null }],
    };

    expect(() => featureHighlightsModuleQuery.parse(raw)).toThrow();
  });

  it('rejects a highlight with no image', () => {
    const raw = {
      ...makeRawFeatureHighlightsModule(),
      highlights: [{ ...makeRawFeatureHighlightItem(), image: null }],
    };

    expect(() => featureHighlightsModuleQuery.parse(raw)).toThrow();
  });

  it('parses a highlight with no action', () => {
    const raw = {
      ...makeRawFeatureHighlightsModule(),
      highlights: [makeRawFeatureHighlightItem({ action: null })],
    };

    expect(() => featureHighlightsModuleQuery.parse(raw)).not.toThrow();
    expect(
      featureHighlightsModuleQuery.parse(raw).highlights?.[0]?.action,
    ).toBeNull();
  });

  it('rejects a module with no mediaOrder', () => {
    const raw = { ...makeRawFeatureHighlightsModule(), mediaOrder: null };

    expect(() => featureHighlightsModuleQuery.parse(raw)).toThrow();
  });
});
