import type {
  Block_faq,
  Module_faq,
} from '@blog/config/sanity/generated/types';

import { BRAND_VARIANT } from '@blog/config/constants';

import type {
  TStarterDocument,
  TStarterDocumentUnion,
  TStarterModule,
} from './starter-document';
import {
  keyedReference,
  localizedListedText,
  localizedString,
  moduleHeadingBlock,
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
  const blocks = questions.map(
    ({ question, answer }, index) =>
      ({
        _id: `${id}Question${index + 1}`,
        _type: 'block_faq',
        title: question,
        question: localizedString(locale, question),
        answer: localizedListedText(locale, answer),
      }) satisfies TStarterDocument<Block_faq, 'title' | 'question' | 'answer'>,
  );

  return [
    ...blocks,
    {
      _id: id,
      _type: 'module_faq',
      title,
      brandVariant: BRAND_VARIANT.PRIMARY,
      headingBlock: moduleHeadingBlock(locale, heading),
      questions: blocks.map(({ _id }) => keyedReference(_id)),
    } satisfies TStarterModule<Module_faq>,
  ];
}
