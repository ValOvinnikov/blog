import { defineField } from 'sanity';

export const LANGUAGE_SWITCHER_FIELD_NAME = 'showLanguageSwitcher';

export const languageSwitcherField = () =>
  defineField({
    name: LANGUAGE_SWITCHER_FIELD_NAME,
    title: 'Show language switcher',
    type: 'boolean',
    description: "Lets visitors pick one of your site's languages.",
    initialValue: false,
  });
