import type { TLocaleIsoCode } from '@blog/config/constants';
import { REDIRECT_TYPE } from '@blog/studio/schema-types/documents/redirect/redirect-type';
import { languageField } from '@blog/studio/schema-types/fields/language-field/language-field';
import { LOCALE_LABEL } from '@blog/studio/schema-types/inputs/localization-notice-input/missing-locales';
import { getDefaultLanguage } from '@blog/studio/schema-types/validation/default-language/default-language';
import {
  validateRedirectDestination,
  validateRedirectSource,
} from '@blog/studio/schema-types/validation/validate-redirect-chain/validate-redirect-chain';
import { Signpost } from 'lucide-react';
import { defineField, defineType } from 'sanity';

const SITE_PATH = /^\/(?:[^\s/?#]+(?:\/[^\s/?#]+)*)?$/;

const INVALID_PATH =
  'Enter a path on this site starting with "/", e.g. /modules/faq — no domain, spaces, "?", "#" or trailing "/".';

const validatePath = (value: string | undefined) =>
  !value || SITE_PATH.test(value) ? true : INVALID_PATH;

export const redirectSchema = defineType({
  name: REDIRECT_TYPE,
  title: 'Redirect',
  type: 'document',
  description:
    'Sends visitors from an old address to a new one, so links to a page that moved keep working. Moving or renaming a Landing page adds one automatically.',
  icon: Signpost,
  fields: [
    defineField({
      ...languageField(),
      readOnly: false,
      hidden: false,
      description: 'The language version of the site this redirect applies to.',
      initialValue: () => getDefaultLanguage(),
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'source',
      title: 'From',
      type: 'string',
      description:
        'The old address visitors arrive at, e.g. /modules/old-faq. A page published at this address always wins over the redirect.',
      validation: (rule) =>
        rule
          .required()
          .custom((value: string | undefined) =>
            value === '/'
              ? 'The home page cannot be redirected.'
              : validatePath(value),
          )
          .custom(validateRedirectSource),
    }),
    defineField({
      name: 'destination',
      title: 'To',
      type: 'string',
      description:
        'The address visitors are sent to instead, e.g. /modules/faq.',
      validation: (rule) =>
        rule
          .required()
          .custom(validatePath)
          .custom(validateRedirectDestination)
          .custom((value: string | undefined, { document }) =>
            value && value === document?.source
              ? 'A redirect cannot send visitors to the address they came from.'
              : true,
          ),
    }),
    defineField({
      name: 'isPrefix',
      title: 'Include Sub-pages',
      type: 'boolean',
      description:
        'Also redirect every address beneath the old one, e.g. /old/faq to /new/faq. Use it when a page with sub-pages moved.',
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      source: 'source',
      destination: 'destination',
      isPrefix: 'isPrefix',
      language: 'language',
    },
    prepare: ({
      source,
      destination,
      isPrefix,
      language,
    }: {
      source?: string;
      destination?: string;
      isPrefix?: boolean;
      language?: TLocaleIsoCode;
    }) => {
      const suffix = isPrefix ? '/…' : '';

      return {
        title: `${source ?? '?'}${suffix} → ${destination ?? '?'}${suffix}`,
        subtitle: language ? LOCALE_LABEL[language] : undefined,
      };
    },
  },
});
