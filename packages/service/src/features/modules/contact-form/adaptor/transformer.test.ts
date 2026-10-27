import { BRAND_VARIANT, CONTENT_ALIGNMENT } from '@blog/config';
import { mockRawContactFormModule } from '@blog/service/testing/modules/fixtures';
import {
  mockRawHeadingBlock,
  mockRawParagraphTextBlock,
  mockRawWideLayout,
} from '@blog/service/testing/shared/fixtures';
import { faker } from '@faker-js/faker';

import { toContactFormModule, type TRawContactFormModule } from './transformer';

type TRawPrivacyNoteBlock = NonNullable<
  TRawContactFormModule['privacyNote']
>[number];

faker.seed(12);

const MOCK_HEADING = faker.lorem.words(3);
const MOCK_SUPPORTING_TEXT = faker.lorem.sentence();
const MOCK_SUCCESS_MESSAGE = faker.lorem.sentence();
const MOCK_PRIVACY_NOTE_TEXT = faker.lorem.sentence();
const MOCK_LAYOUT = mockRawWideLayout();

describe(toContactFormModule, () => {
  it('maps a fully authored contact form module', () => {
    const privacyNoteBlock = mockRawParagraphTextBlock<TRawPrivacyNoteBlock>({
      text: MOCK_PRIVACY_NOTE_TEXT,
    });
    const raw = mockRawContactFormModule({
      brandVariant: BRAND_VARIANT.SECONDARY,
      headingBlock: mockRawHeadingBlock(MOCK_HEADING, {
        supportingText: MOCK_SUPPORTING_TEXT,
      }),
      successMessage: MOCK_SUCCESS_MESSAGE,
      privacyNote: [privacyNoteBlock],
      contentAlignment: CONTENT_ALIGNMENT.CENTER,
      layout: MOCK_LAYOUT,
    });

    const module = toContactFormModule(raw);

    expect(module).toEqual({
      brandVariant: BRAND_VARIANT.SECONDARY,
      headingBlock: {
        heading: MOCK_HEADING,
        supportingText: MOCK_SUPPORTING_TEXT,
      },
      successMessage: MOCK_SUCCESS_MESSAGE,
      privacyNote: [{ ...privacyNoteBlock, markDefs: undefined }],
      contentAlignment: CONTENT_ALIGNMENT.CENTER,
      layout: MOCK_LAYOUT,
    });
  });

  it('leaves privacyNote undefined when none is authored', () => {
    const raw = mockRawContactFormModule({ privacyNote: null });

    const module = toContactFormModule(raw);

    expect(module.privacyNote).toBeUndefined();
  });

  it('leaves contentAlignment and layout undefined when unset', () => {
    const raw = mockRawContactFormModule();

    const module = toContactFormModule(raw);

    expect(module.contentAlignment).toBeUndefined();
    expect(module.layout).toBeUndefined();
  });
});
