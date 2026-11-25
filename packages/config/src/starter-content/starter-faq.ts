import { BRAND_VARIANT } from '@shinefold/config/constants';
import type {
  Block_faq,
  Module_faq,
} from '@shinefold/config/sanity/generated/types';

import type { TStarterDocumentUnion, TStarterModule } from './starter-document';
import type { TStarterDocument } from './starter-document-shape';
import {
  localizedListedText,
  localizedString,
  moduleHeadingBlock,
  moduleItemDocuments,
} from './starter-fields';
import type { TModuleInput } from './starter-modules';

type TFaqCopy = {
  heading: string;
  questions: readonly { question: string; answer: readonly string[] }[];
};

export function buildFaqModule({
  id,
  title,
  locale,
  faq: { heading, questions },
}: TModuleInput & { faq: TFaqCopy }): TStarterDocumentUnion[] {
  const { documents, references } = moduleItemDocuments(
    id,
    'Question',
    questions,
    ({ question, answer }, itemId) =>
      ({
        _id: itemId,
        _type: 'block_faq',
        title: question,
        question: localizedString(locale, question),
        answer: localizedListedText(locale, answer),
      }) satisfies TStarterDocument<Block_faq, 'title' | 'question' | 'answer'>,
  );

  return [
    ...documents,
    {
      _id: id,
      _type: 'module_faq',
      title,
      brandVariant: BRAND_VARIANT.PRIMARY,
      headingBlock: moduleHeadingBlock(locale, heading),
      questions: references,
    } satisfies TStarterModule<Module_faq>,
  ];
}
