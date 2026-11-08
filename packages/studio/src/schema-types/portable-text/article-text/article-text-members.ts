import { PORTABLE_TEXT_STYLE } from '@blog/config/constants';
import { asideSchema } from '@blog/studio/schema-types/objects/aside/aside';
import { bodyImageSchema } from '@blog/studio/schema-types/objects/body-image/body-image';
import { cookieListSchema } from '@blog/studio/schema-types/objects/cookie-list/cookie-list';
import { cookiePreferencesLinkSchema } from '@blog/studio/schema-types/objects/cookie-preferences-link/cookie-preferences-link';
import { linkRefSchema } from '@blog/studio/schema-types/objects/link-ref/link-ref';
import {
  boldDecorator,
  codeDecorator,
  italicDecorator,
  strikeThroughDecorator,
  subscriptDecorator,
  superscriptDecorator,
  underlineDecorator,
} from '@blog/studio/schema-types/portable-text/decorators/decorators';
import {
  defineArrayMember,
  type BlockMarksDefinition,
  type BlockStyleDefinition,
} from 'sanity';

const normalStyle: BlockStyleDefinition = {
  title: 'Normal',
  value: PORTABLE_TEXT_STYLE.NORMAL,
};

const subheadingAndQuoteStyles: BlockStyleDefinition[] = [
  { title: 'H3', value: PORTABLE_TEXT_STYLE.H3 },
  { title: 'H4', value: PORTABLE_TEXT_STYLE.H4 },
  { title: 'Quote', value: PORTABLE_TEXT_STYLE.BLOCKQUOTE },
];

// Excludes H1 so the body never competes with the post/page title's own heading.
export const articleTextStyles: BlockStyleDefinition[] = [
  normalStyle,
  { title: 'H2', value: PORTABLE_TEXT_STYLE.H2 },
  ...subheadingAndQuoteStyles,
];

// H3 and below only, so the contents rail built from H2s stays accurate.
export const expandableSectionTextStyles: BlockStyleDefinition[] = [
  normalStyle,
  ...subheadingAndQuoteStyles,
];

export const articleTextMarks: BlockMarksDefinition = {
  decorators: [
    boldDecorator,
    italicDecorator,
    codeDecorator,
    underlineDecorator,
    strikeThroughDecorator,
    subscriptDecorator,
    superscriptDecorator,
  ],
  annotations: [
    { type: linkRefSchema.name },
    { type: cookiePreferencesLinkSchema.name },
  ],
};

export const articleTextEmbeds = [
  defineArrayMember({ type: bodyImageSchema.name }),
  defineArrayMember({ type: 'code' }),
  defineArrayMember({ type: asideSchema.name }),
  defineArrayMember({ type: cookieListSchema.name }),
];
