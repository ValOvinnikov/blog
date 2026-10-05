import { LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  localizedStrings,
  localizedValues,
  paragraphBlocks,
} from '@blog/service/testing/shared/localized';

const { EN, NL, FR } = LOCALE_ISO_CODES;

function reference(id: string) {
  return { _key: id, _type: 'reference', _ref: id };
}

export const faqPageDocuments = [
  {
    _id: 'module-faq-a',
    _type: 'module_faq',
    questions: [
      reference('question-ok'),
      reference('question-deleted'),
      reference('question-untranslated'),
    ],
  },
  {
    _id: 'module-faq-b',
    _type: 'module_faq',
    questions: [reference('question-ok')],
  },
  {
    _id: 'question-ok',
    _type: 'block_faq',
    question: localizedStrings({ [EN]: 'How much?', [NL]: 'Hoeveel?' }),
    answer: localizedValues('internationalizedArrayListedTextValue', {
      [EN]: paragraphBlocks('It depends.'),
      [NL]: paragraphBlocks('Dat hangt ervan af.'),
    }),
  },
  {
    _id: 'question-untranslated',
    _type: 'block_faq',
    question: localizedStrings({ [FR]: 'Combien?' }),
    answer: localizedValues('internationalizedArrayListedTextValue', {
      [FR]: paragraphBlocks('Ça dépend.'),
    }),
  },
];
