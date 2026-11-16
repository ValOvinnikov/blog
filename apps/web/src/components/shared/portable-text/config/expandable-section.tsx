import {
  PortableText as PortableTextRoot,
  type PortableTextReactComponents,
} from '@portabletext/react';
import type { PORTABLE_TEXT_BLOCK_TYPE } from '@shinefold/config';
import type { TPortableTextBody } from '@shinefold/service';
import { headingVariants } from '@shinefold/ui/components/atoms/heading/heading-variants';
import { Accordion } from '@shinefold/ui/components/organisms/accordion';

import { expandableSectionVariants } from './expandable-section-variants';
import { FULL_BLEED_DATA_ATTR } from './full-bleed';

const expandableSectionTitle = headingVariants({ visual: 'prose-h3' });

type TResolvedExpandableSectionBlock = Extract<
  TPortableTextBody[number],
  { _type: typeof PORTABLE_TEXT_BLOCK_TYPE.EXPANDABLE_SECTION }
>;

export const makeExpandableSectionTypeComponent = (
  baseComponents: PortableTextReactComponents,
  isFullBleed: boolean,
) => {
  const fullBleedAttr = isFullBleed ? { [FULL_BLEED_DATA_ATTR]: '' } : {};

  const ExpandableSectionType = ({
    value,
  }: {
    value: TResolvedExpandableSectionBlock;
  }) => (
    <div
      {...fullBleedAttr}
      className={expandableSectionVariants({ isFullBleed })}
    >
      <Accordion>
        <Accordion.Item>
          <Accordion.Trigger className={expandableSectionTitle}>
            {value.title}
          </Accordion.Trigger>
          <Accordion.Panel>
            <PortableTextRoot
              value={value.body ?? []}
              components={baseComponents}
            />
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </div>
  );

  return ExpandableSectionType;
};
