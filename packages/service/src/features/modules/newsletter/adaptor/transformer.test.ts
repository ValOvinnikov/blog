import { faker } from '@faker-js/faker';
import {
  BRAND_VARIANT,
  CONTENT_ALIGNMENT,
  NEWSLETTER_VARIANT,
} from '@shinefold/config/constants';
import { mockRawNewsletterModule } from '@shinefold/service/testing/modules/fixtures';
import { mockRawWideLayout } from '@shinefold/service/testing/shared/fixtures';
import {
  mockRawModuleHeadingBlock,
  mockModuleHeadingBlockView,
} from '@shinefold/service/testing/shared/localized';

import { toNewsletterModule } from './transformer';

faker.seed(9);

const MOCK_HEADING = faker.lorem.words(3);
const MOCK_SUPPORTING_TEXT = faker.lorem.sentence();
const MOCK_CONTENT = faker.lorem.sentence();
const MOCK_FIRST_TRUST_CUE = faker.lorem.words(2);
const MOCK_SECOND_TRUST_CUE = faker.lorem.words(2);

type TNewsletterModule = ReturnType<typeof toNewsletterModule>;

describe(toNewsletterModule, () => {
  it('maps headingBlock straight through', () => {
    const raw = mockRawNewsletterModule({
      headingBlock: mockRawModuleHeadingBlock(MOCK_HEADING, {
        supportingText: MOCK_SUPPORTING_TEXT,
      }),
    });

    const module = toNewsletterModule(raw);

    expect(module.headingBlock).toEqual(
      mockModuleHeadingBlockView(MOCK_HEADING, MOCK_SUPPORTING_TEXT),
    );
  });

  it.each([
    [
      'brandVariant',
      { brandVariant: BRAND_VARIANT.SECONDARY },
      (module: TNewsletterModule) => module.brandVariant,
      BRAND_VARIANT.SECONDARY,
    ],
    [
      'variant',
      { variant: NEWSLETTER_VARIANT.COMPACT },
      (module: TNewsletterModule) => module.variant,
      NEWSLETTER_VARIANT.COMPACT,
    ],
    [
      'content',
      { content: MOCK_CONTENT },
      (module: TNewsletterModule) => module.content,
      MOCK_CONTENT,
    ],
    [
      'contentAlignment',
      { contentAlignment: CONTENT_ALIGNMENT.CENTER },
      (module: TNewsletterModule) => module.contentAlignment,
      CONTENT_ALIGNMENT.CENTER,
    ],
  ])('maps an authored %s straight through', (_, authored, read, expected) => {
    const module = toNewsletterModule(mockRawNewsletterModule(authored));

    expect(read(module)).toBe(expected);
  });

  it('flattens the trust cues to their text, skipping a cue with none', () => {
    const raw = mockRawNewsletterModule({
      trustCues: [
        { text: MOCK_FIRST_TRUST_CUE },
        { text: null },
        { text: MOCK_SECOND_TRUST_CUE },
      ],
    });

    const module = toNewsletterModule(raw);

    expect(module.trustCues).toEqual([
      MOCK_FIRST_TRUST_CUE,
      MOCK_SECOND_TRUST_CUE,
    ]);
  });

  it.each([
    ['trustCues', { trustCues: null }, (m: TNewsletterModule) => m.trustCues],
    ['content', { content: null }, (m: TNewsletterModule) => m.content],
    [
      'contentAlignment',
      { contentAlignment: null },
      (m: TNewsletterModule) => m.contentAlignment,
    ],
    ['layout', { layout: null }, (m: TNewsletterModule) => m.layout],
  ])('leaves an unset %s undefined', (_, unset, read) => {
    const module = toNewsletterModule(mockRawNewsletterModule(unset));

    expect(read(module)).toBeUndefined();
  });

  it('leaves supportingText undefined when not set', () => {
    const raw = mockRawNewsletterModule({
      headingBlock: mockRawModuleHeadingBlock(MOCK_HEADING),
    });

    const module = toNewsletterModule(raw);

    expect(module.headingBlock.supportingText).toBeUndefined();
  });

  it('maps a fully-authored layout object 1:1', () => {
    const layout = mockRawWideLayout();
    const raw = mockRawNewsletterModule({ layout });

    const module = toNewsletterModule(raw);

    expect(module.layout).toEqual(layout);
  });
});
