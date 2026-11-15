import type { IWithDataTestId } from '@blog/config';
import type { TFaqModule } from '@blog/service';
import { Accordion } from '@blog/ui/components/organisms/accordion';
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
                <PortableText value={question.answer} />
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
        <ModuleActions actions={ctaButtons} align={contentAlignment} />
      </div>
    </ModuleSection>
  );
};
