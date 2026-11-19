import {
  TEXT_ROLE,
  type TContentAlignment,
  type THeadingBlock,
} from '@shinefold/config';
import { Heading } from '@shinefold/ui/components/atoms/heading';
import { Text } from '@shinefold/ui/components/atoms/text';

import { pageHeadingVariants } from './page-heading-variants';

export interface IPageHeadingProps {
  headingBlock: THeadingBlock;
  align?: TContentAlignment;
}

export const PageHeading = ({ headingBlock, align }: IPageHeadingProps) => {
  const { heading, supportingText } = headingBlock;
  const s = pageHeadingVariants({
    align,
    hasSupportingText: Boolean(supportingText),
  });

  return (
    <div className={s.root()}>
      <div className={s.inner()}>
        <div className={s.text()}>
          <Heading
            level={1}
            visual={TEXT_ROLE.PAGE_TITLE}
            className={s.heading()}
          >
            {heading}
          </Heading>
          {supportingText ? (
            <Text textRole={TEXT_ROLE.INTRO} className={s.supportingText()}>
              {supportingText}
            </Text>
          ) : null}
        </div>
      </div>
    </div>
  );
};
