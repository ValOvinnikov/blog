import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { mockReference } from '@blog/service/testing/shared/fixtures';
import {
  mockLocalizedListedText,
  mockLocalizedStrings,
} from '@blog/service/testing/shared/localized';

const { EN, NL, FR } = LOCALE_ISO_CODES;

const QUESTION_OK_ID = 'question-ok';
const QUESTION_UNTRANSLATED_ID = 'question-untranslated';

export const MOCK_FAQ_PAGE_DOCUMENTS = [
  {
    _id: 'module-faq-a',
    _type: 'module_faq',
    questions: [
      mockReference(QUESTION_OK_ID, { _key: QUESTION_OK_ID }),
      mockReference(QUESTION_UNTRANSLATED_ID, {
        _key: QUESTION_UNTRANSLATED_ID,
      }),
    ],
  },
  {
    _id: 'module-faq-b',
    _type: 'module_faq',
    questions: [mockReference(QUESTION_OK_ID, { _key: QUESTION_OK_ID })],
  },
  {
    _id: QUESTION_OK_ID,
    _type: 'block_faq',
    question: mockLocalizedStrings({ [EN]: 'How much?', [NL]: 'Hoeveel?' }),
    answer: mockLocalizedListedText({
      [EN]: 'It depends.',
      [NL]: 'Dat hangt ervan af.',
    }),
  },
  {
    _id: QUESTION_UNTRANSLATED_ID,
    _type: 'block_faq',
    question: mockLocalizedStrings({ [FR]: 'Combien?' }),
    answer: mockLocalizedListedText({ [FR]: 'Ça dépend.' }),
  },
];
