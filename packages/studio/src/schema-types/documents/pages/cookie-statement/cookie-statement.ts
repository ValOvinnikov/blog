import { routes } from '@shinefold/config';
import { PAGE_COOKIE_STATEMENT_TYPE } from '@shinefold/studio/schema-types/documents/pages/cookie-statement/cookie-statement-type';
import { articleContentField } from '@shinefold/studio/schema-types/fields/article-content-field/article-content-field';
import { languageField } from '@shinefold/studio/schema-types/fields/language-field/language-field';
import { titleField } from '@shinefold/studio/schema-types/fields/title-field/title-field';
import { pageHeadingBlockField } from '@shinefold/studio/schema-types/objects/page-heading-block/page-heading-block-field';
import { seoField } from '@shinefold/studio/schema-types/objects/seo/seo-field';
import { languagePreview } from '@shinefold/studio/schema-types/preview/language-preview/language-preview';
import { validateOnePerLanguage } from '@shinefold/studio/schema-types/validation/validate-one-per-language/validate-one-per-language';
import { Cookie } from 'lucide-react';
import { defineType } from 'sanity';

export const cookieStatementPageSchema = defineType({
  name: PAGE_COOKIE_STATEMENT_TYPE,
  title: 'Cookie Statement',
  type: 'document',
  description: `The page the cookie banner links to, at ${routes.cookieStatement()}. Every language has one, and it cannot be deleted or unpublished.`,
  icon: Cookie,
  preview: languagePreview,
  validation: (rule) => rule.custom(validateOnePerLanguage),
  fields: [
    languageField(),
    titleField(),
    ...pageHeadingBlockField(),
    articleContentField(
      'The full statement. Keep the cookie list and a cookie-preferences link in it.',
    ),
    seoField(),
  ],
});
