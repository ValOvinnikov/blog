import {
  DIV_AS_CONST,
  type IWithDataTestId,
  TEXT_ROLE,
} from '@shinefold/config';
import type { TFaqModule } from '@shinefold/service';
import { Text } from '@shinefold/ui/components/atoms/text';
import { Accordion } from '@shinefold/ui/components/organisms/accordion';
import { ModuleActions } from '@web/components/shared/module-actions';
import { ModuleSection } from '@web/components/shared/module-section';
import { PortableText } from '@web/components/shared/portable-text';
import type { TModuleSection } from '@web/components/shared/section';

import { faqModuleViewVariants } from './faq-module-view-variants';

export interface IFaqModuleViewProps
  extends
    IWithDataTestId,
    Pick<
      TFaqModule,
      'headingBlock' | 'questions' | 'ctaButtons' | 'contentAlignment'
    > {
  section: TModuleSection;
  titleId: string;
}

export const FaqModuleView = ({
  section,
  headingBlock,
  questions,
  ctaButtons,
  contentAlignment,
  titleId,
  dataTestId,
}: IFaqModuleViewProps) => {
  const s = faqModuleViewVariants({ align: contentAlignment });

  return (
    <ModuleSection
      module={{ ...section, headingBlock, contentAlignment }}
      titleId={titleId}
      dataTestId={dataTestId}
    >
      <div className={s.wrapper()}>
        <Accordion dataTestId={`${dataTestId}-accordion`}>
          {questions.map((question) => (
            <Accordion.Item key={question.id}>
              <Accordion.Trigger>{question.question}</Accordion.Trigger>
              <Accordion.Panel>
                <Text as={DIV_AS_CONST} textRole={TEXT_ROLE.CARD_BODY}>
                  <PortableText value={question.answer} />
                </Text>
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
        <ModuleActions actions={ctaButtons} align={contentAlignment} />
      </div>
    </ModuleSection>
  );
};
