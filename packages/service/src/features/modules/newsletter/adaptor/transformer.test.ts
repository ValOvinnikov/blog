import {
  BRAND_VARIANT,
  CONTENT_ALIGNMENT,
  NEWSLETTER_VARIANT,
} from '@blog/config/constants';
import {
  MOCK_NEWSLETTER_HEADING,
  mockRawNewsletterModule,
} from '@blog/service/testing/modules/fixtures';
import {
  mockRawHeadingBlock,
  mockRawWideLayout,
} from '@blog/service/testing/shared/fixtures';

import { toNewsletterModule } from './transformer';

describe(toNewsletterModule, () => {
  it('maps headingBlock straight through', () => {
    const raw = mockRawNewsletterModule();

    const module = toNewsletterModule(raw);

    expect(module.headingBlock).toEqual({
      heading: MOCK_NEWSLETTER_HEADING,
      supportingText: 'Get new posts in your inbox.',
    });
  });

  it.each([
    { brandVariant: BRAND_VARIANT.SECONDARY },
    { variant: NEWSLETTER_VARIANT.COMPACT },
    { content: 'A note from the editor.' },
    { contentAlignment: CONTENT_ALIGNMENT.CENTER },
  ])('maps an authored %o straight through', (authored) => {
    const module = toNewsletterModule(mockRawNewsletterModule(authored));

    expect(module).toMatchObject(authored);
  });

  it('flattens the trust cues to their text, skipping a cue with none', () => {
    const raw = mockRawNewsletterModule({
      trustCues: [{ text: 'No spam' }, { text: null }, { text: 'Weekly' }],
    });

    const module = toNewsletterModule(raw);

    expect(module.trustCues).toEqual(['No spam', 'Weekly']);
  });

  it.each([
    [{ trustCues: null }, { trustCues: undefined }],
    [{ content: null }, { content: undefined }],
    [{ contentAlignment: null }, { contentAlignment: undefined }],
    [{ layout: null }, { layout: undefined }],
  ])('maps an unset %o to %o', (unset, expected) => {
    const module = toNewsletterModule(mockRawNewsletterModule(unset));

    expect(module).toMatchObject(expected);
  });

  it('leaves supportingText undefined when not set', () => {
    const raw = mockRawNewsletterModule({
      headingBlock: mockRawHeadingBlock(MOCK_NEWSLETTER_HEADING),
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
