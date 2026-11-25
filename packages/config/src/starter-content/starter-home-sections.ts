import type { TLocaleIsoCode } from '@shinefold/config/constants';

import type { TStarterDocumentUnion } from './starter-document';
import { buildFaqModule, type TFaqCopy } from './starter-faq';
import { moduleSlot } from './starter-fields';
import {
  INTRODUCTION_MODULE_TITLE,
  QUESTIONS_MODULE_TITLE,
} from './starter-module-titles';
import {
  buildCalloutCta,
  buildContentModule,
  type TCalloutCtaInput,
} from './starter-modules';
import { paragraphs } from './starter-portable-text';

type TWithId = { id: string };

export function buildHomeSections({
  locale,
  intro,
  faq: { id: faqId, ...faq },
  cta,
}: {
  locale: TLocaleIsoCode;
  intro: TWithId & { body: readonly string[] };
  faq: TWithId & TFaqCopy;
  cta?: Omit<TCalloutCtaInput, 'locale'>;
}) {
  const modules = [
    moduleSlot(intro.id, 'module_content'),
    moduleSlot(faqId, 'module_faq'),
    ...(cta ? [moduleSlot(cta.id, 'module_cta')] : []),
  ];
  const documents: TStarterDocumentUnion[] = [
    buildContentModule({
      id: intro.id,
      title: INTRODUCTION_MODULE_TITLE,
      locale,
      body: paragraphs(intro.body),
    }),
    ...buildFaqModule({
      id: faqId,
      title: QUESTIONS_MODULE_TITLE,
      locale,
      faq,
    }),
    ...(cta ? [buildCalloutCta({ ...cta, locale })] : []),
  ];

  return { modules, documents };
}
