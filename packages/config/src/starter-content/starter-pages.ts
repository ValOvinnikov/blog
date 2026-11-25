import type { TLocaleIsoCode } from '@shinefold/config/constants';

import { pageHeadingBlock, reference, seo } from './starter-fields';

type TPageFieldsCopy = {
  title: string;
  heading: string;
  supportingText: string;
  metaTitle: string;
  metaDescription: string;
};

export function starterTemplate<TTemplateType extends `template_${string}`>(
  id: string,
  type: TTemplateType,
  title: string,
) {
  return { _id: id, _type: type, title };
}

export function pageFields(
  locale: TLocaleIsoCode,
  templateId: string,
  {
    title,
    heading,
    supportingText,
    metaTitle,
    metaDescription,
  }: TPageFieldsCopy,
) {
  return {
    language: locale,
    title,
    headingBlock: pageHeadingBlock(heading, supportingText),
    template: reference(templateId),
    seo: seo(metaTitle, metaDescription),
  };
}
