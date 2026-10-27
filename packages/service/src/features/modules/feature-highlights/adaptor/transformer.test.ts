import {
  mockRawCtaButton,
  mockRawFeatureHighlightItem,
  mockRawFeatureHighlightsModule,
} from '@blog/service/testing/modules/fixtures';
import { mockRawInternalLinkDocument } from '@blog/service/testing/shared/fixtures';
import { faker } from '@faker-js/faker';

import { toFeatureHighlightsModule } from './transformer';

faker.seed(5);

const MOCK_HIGHLIGHT_KEYS = [
  faker.string.uuid(),
  faker.string.uuid(),
  faker.string.uuid(),
];
const MOCK_BROKEN_ACTION_ROW_HEADING = faker.lorem.words(3);

describe(toFeatureHighlightsModule, () => {
  it('leaves contentAlignment and layout undefined when unset', () => {
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
      highlights: MOCK_HIGHLIGHT_KEYS.map((_key) =>
        mockRawFeatureHighlightItem({ _key }),
      ),
    });

    const module = toFeatureHighlightsModule(raw);

    expect(module.highlights.map((highlight) => highlight.id)).toEqual(
      MOCK_HIGHLIGHT_KEYS,
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
          heading: MOCK_BROKEN_ACTION_ROW_HEADING,
          action: mockRawCtaButton({
            link: mockRawInternalLinkDocument(),
          }),
        }),
      ],
    });

    const module = toFeatureHighlightsModule(raw);

    expect(module.highlights[0]?.heading).toBe(MOCK_BROKEN_ACTION_ROW_HEADING);
    expect(module.highlights[0]?.action).toBeUndefined();
  });
});
