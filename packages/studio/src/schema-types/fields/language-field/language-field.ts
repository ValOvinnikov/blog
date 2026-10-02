import { LOCALE_ISO_CODES, LOCALE_NATIVE_LABEL } from '@blog/config/constants';
import { defineField } from 'sanity';

export const LANGUAGE_FIELD = 'language';

export const languageField = () =>
  defineField({
    name: LANGUAGE_FIELD,
    title: 'Language',
    type: 'string',
    options: {
      list: Object.values(LOCALE_ISO_CODES).map((value) => ({
        title: LOCALE_NATIVE_LABEL[value],
        value,
      })),
      layout: 'dropdown',
    },
    readOnly: true,
    hidden: true,
  });
