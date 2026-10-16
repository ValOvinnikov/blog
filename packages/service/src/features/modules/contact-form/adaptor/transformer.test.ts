import {
  BRAND_VARIANT,
  CONTAINER_WIDTH,
  CONTENT_ALIGNMENT,
} from '@blog/config';
import { makeRawContactFormModule } from '@blog/service/testing/modules/fixtures';
import { makeRawParagraphTextBlock } from '@blog/service/testing/shared/fixtures';

import { toContactFormModule, type TRawContactFormModule } from './transformer';

type TRawPrivacyNoteBlock = NonNullable<
  TRawContactFormModule['privacyNote']
>[number];

describe('toContactFormModule', () => {
  it('maps a fully authored contact form module', () => {
    const raw = makeRawContactFormModule({
      brandVariant: BRAND_VARIANT.SECONDARY,
      privacyNote: [
        makeRawParagraphTextBlock<TRawPrivacyNoteBlock>({
          text: 'We only use your details to reply.',
        }),
      ],
      contentAlignment: CONTENT_ALIGNMENT.CENTER,
      layout: {
        spacingTop: 'SM',
        spacingBottom: 'LG',
        containerWidth: CONTAINER_WIDTH.WIDE,
        dividerTop: true,
        dividerBottom: false,
      },
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
              text: 'We only use your details to reply.',
            },
          ],
          markDefs: undefined,
        },
      ],
      contentAlignment: CONTENT_ALIGNMENT.CENTER,
      layout: {
        spacingTop: 'SM',
        spacingBottom: 'LG',
        containerWidth: CONTAINER_WIDTH.WIDE,
        dividerTop: true,
        dividerBottom: false,
      },
    });
  });

  it('leaves privacyNote undefined when none is authored', () => {
    const raw = makeRawContactFormModule({ privacyNote: null });

    const module = toContactFormModule(raw);

    expect(module.privacyNote).toBeUndefined();
  });

  it('leaves contentAlignment and layout undefined when unset', () => {
    const raw = makeRawContactFormModule();

    const module = toContactFormModule(raw);

    expect(module.contentAlignment).toBeUndefined();
    expect(module.layout).toBeUndefined();
  });
});
