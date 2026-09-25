import type { TFaqPageQuestion } from '@blog/service';
import { JsonLd } from '@web/components/shared/json-ld';
import { buildFaqPageSchema } from '@web/utils/build-faq-page-schema';

export type TFaqPageSchemaProps = {
  faqs: TFaqPageQuestion[];
};

export const FaqPageSchema = ({ faqs }: TFaqPageSchemaProps) => {
  const schema = buildFaqPageSchema(faqs);

  return schema ? <JsonLd schema={schema} /> : null;
};
