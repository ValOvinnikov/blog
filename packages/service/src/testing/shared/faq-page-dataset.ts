import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { mockReference } from '@blog/service/testing/shared/fixtures';
import {
  mockLocalizedListedText,
  mockLocalizedStrings,
} from '@blog/service/testing/shared/localized';

const { EN, NL, FR } = LOCALE_ISO_CODES;

export const MOCK_FAQ_MODULE_A_ID = 'module-faq-a';
export const MOCK_FAQ_MODULE_B_ID = 'module-faq-b';
export const MOCK_TRANSLATED_QUESTION_ID = 'question-ok';
export const MOCK_UNTRANSLATED_QUESTION_ID = 'question-untranslated';
export const MOCK_TRANSLATED_QUESTION = { [EN]: 'How much?', [NL]: 'Hoeveel?' };
export const MOCK_TRANSLATED_ANSWER = {
  [EN]: 'It depends.',
  [NL]: 'Dat hangt ervan af.',
};
export const MOCK_UNTRANSLATED_QUESTION = { [FR]: 'Combien?' };
export const MOCK_UNTRANSLATED_ANSWER = { [FR]: 'Ça dépend.' };

export const MOCK_FAQ_PAGE_DOCUMENTS = [
  {
    _id: MOCK_FAQ_MODULE_A_ID,
    _type: 'module_faq',
    questions: [
      mockReference(MOCK_TRANSLATED_QUESTION_ID, {
        _key: MOCK_TRANSLATED_QUESTION_ID,
      }),
      mockReference(MOCK_UNTRANSLATED_QUESTION_ID, {
        _key: MOCK_UNTRANSLATED_QUESTION_ID,
      }),
    ],
  },
  {
    _id: MOCK_FAQ_MODULE_B_ID,
    _type: 'module_faq',
    questions: [
      mockReference(MOCK_TRANSLATED_QUESTION_ID, {
        _key: MOCK_TRANSLATED_QUESTION_ID,
      }),
    ],
  },
  {
    _id: MOCK_TRANSLATED_QUESTION_ID,
    _type: 'block_faq',
    question: mockLocalizedStrings(MOCK_TRANSLATED_QUESTION),
    answer: mockLocalizedListedText(MOCK_TRANSLATED_ANSWER),
  },
  {
    _id: MOCK_UNTRANSLATED_QUESTION_ID,
    _type: 'block_faq',
    question: mockLocalizedStrings(MOCK_UNTRANSLATED_QUESTION),
    answer: mockLocalizedListedText(MOCK_UNTRANSLATED_ANSWER),
  },
];
