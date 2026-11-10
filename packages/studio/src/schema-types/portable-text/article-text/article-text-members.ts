import {
  BLOCKQUOTE_AS_CONST,
  H2_AS_CONST,
  H3_AS_CONST,
  H4_AS_CONST,
} from '@blog/config/constants';
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
import { normalBlockStyle } from '@blog/studio/schema-types/portable-text/listed-text/listed-text';
import {
  defineArrayMember,
  type BlockMarksDefinition,
  type BlockStyleDefinition,
} from 'sanity';

const h4Style: BlockStyleDefinition = { title: 'H4', value: H4_AS_CONST };

const quoteStyle: BlockStyleDefinition = {
  title: 'Quote',
  value: BLOCKQUOTE_AS_CONST,
};

// Excludes H1 so the body never competes with the post/page title's own heading.
export const articleTextStyles: BlockStyleDefinition[] = [
  normalBlockStyle,
  { title: 'H2', value: H2_AS_CONST },
  { title: 'H3', value: H3_AS_CONST },
  h4Style,
  quoteStyle,
];

export const expandableSectionTextStyles: BlockStyleDefinition[] = [
  normalBlockStyle,
  h4Style,
  quoteStyle,
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
