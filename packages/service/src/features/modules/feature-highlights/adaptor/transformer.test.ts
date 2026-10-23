import {
  mockRawCtaButton,
  mockRawFeatureHighlightItem,
  mockRawFeatureHighlightsModule,
} from '@blog/service/testing/modules/fixtures';
import { mockRawInternalLinkDocument } from '@blog/service/testing/shared/fixtures';

import { toFeatureHighlightsModule } from './transformer';

const HIGHLIGHT_KEYS = [
  'block-highlight-b',
  'block-highlight-a',
  'block-highlight-c',
];
const BROKEN_ACTION_ROW_HEADING = 'Row with a broken action';

describe('toFeatureHighlightsModule', () => {
  it('leaves contentAlignment and layout undefined when unset (no faked default)', () => {
    const raw = mockRawFeatureHighlightsModule({
      contentAlignment: null,
      layout: null,
    });

    const module = toFeatureHighlightsModule(raw);

    expect(module.contentAlignment).toBeUndefined();
    expect(module.layout).toBeUndefined();
  });

  it('keeps the highlights in authored order', () => {
    const raw = mockRawFeatureHighlightsModule({
      highlights: HIGHLIGHT_KEYS.map((_key) =>
        mockRawFeatureHighlightItem({ _key }),
      ),
    });

    const module = toFeatureHighlightsModule(raw);

    expect(module.highlights.map((highlight) => highlight.id)).toEqual(
      HIGHLIGHT_KEYS,
    );
  });

  it('leaves a row action undefined when the row has none', () => {
    const raw = mockRawFeatureHighlightsModule({
      highlights: [mockRawFeatureHighlightItem({ action: null })],
    });

    const module = toFeatureHighlightsModule(raw);

    expect(module.highlights[0]?.action).toBeUndefined();
  });

  it('keeps a row whose action link cannot resolve, dropping only the action', () => {
    const raw = mockRawFeatureHighlightsModule({
      highlights: [
        mockRawFeatureHighlightItem({
          heading: BROKEN_ACTION_ROW_HEADING,
          action: mockRawCtaButton({
            link: mockRawInternalLinkDocument(),
          }),
        }),
      ],
    });

    const module = toFeatureHighlightsModule(raw);

    expect(module.highlights[0]?.heading).toBe(BROKEN_ACTION_ROW_HEADING);
    expect(module.highlights[0]?.action).toBeUndefined();
  });
});
