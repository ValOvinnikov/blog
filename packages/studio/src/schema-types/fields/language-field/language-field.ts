import { defineField } from 'sanity';

export const LANGUAGE_FIELD = 'language';

// Written by the document-internationalization plugin when a translation is created.
export const languageField = () =>
  defineField({
    name: LANGUAGE_FIELD,
    title: 'Language',
    type: 'string',
    readOnly: true,
    hidden: true,
  });
