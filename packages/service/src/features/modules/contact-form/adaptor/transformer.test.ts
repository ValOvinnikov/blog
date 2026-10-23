import { BRAND_VARIANT, CONTENT_ALIGNMENT } from '@blog/config';
import { mockRawContactFormModule } from '@blog/service/testing/modules/fixtures';
import {
  mockRawParagraphTextBlock,
  mockRawWideLayout,
} from '@blog/service/testing/shared/fixtures';

import { toContactFormModule, type TRawContactFormModule } from './transformer';

type TRawPrivacyNoteBlock = NonNullable<
  TRawContactFormModule['privacyNote']
>[number];

const PRIVACY_NOTE_TEXT = 'We only use your details to reply.';

describe('toContactFormModule', () => {
  it('maps a fully authored contact form module', () => {
    const raw = mockRawContactFormModule({
      brandVariant: BRAND_VARIANT.SECONDARY,
      privacyNote: [
        mockRawParagraphTextBlock<TRawPrivacyNoteBlock>({
          text: PRIVACY_NOTE_TEXT,
        }),
      ],
      contentAlignment: CONTENT_ALIGNMENT.CENTER,
      layout: mockRawWideLayout(),
    });

    const module = toContactFormModule(raw);

    expect(module).toEqual({
      brandVariant: BRAND_VARIANT.SECONDARY,
      headingBlock: {
        heading: 'Get in touch',
        supportingText: 'Questions, ideas or work enquiries.',
      },
      successMessage: "Thanks — I'll reply within two days.",
      privacyNote: [
        {
          _type: 'block',
          _key: 'block-1',
          style: 'normal',
          children: [
            {
              _type: 'span',
              _key: 'span-1',
              text: PRIVACY_NOTE_TEXT,
            },
          ],
          markDefs: undefined,
        },
      ],
      contentAlignment: CONTENT_ALIGNMENT.CENTER,
      layout: mockRawWideLayout(),
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
