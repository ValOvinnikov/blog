import type { IWithDataTestId } from '@blog/config';
import type { TFaqModule } from '@blog/service';
import { Accordion } from '@blog/ui/components/organisms/accordion';
import { ModuleActions } from '@web/components/shared/module-actions';
import { ModuleSection } from '@web/components/shared/module-section';
import { PortableText } from '@web/components/shared/portable-text';

import { faqModuleViewVariants } from './faq-module-view-variants';

export interface IFaqModuleViewProps extends IWithDataTestId {
  module: TFaqModule;
  titleId: string;
}

export const FaqModuleView = ({
  module,
  titleId,
  dataTestId,
}: IFaqModuleViewProps) => {
  const { questions, ctaButtons, contentAlignment } = module;
  const s = faqModuleViewVariants({ align: contentAlignment });

  return (
    <ModuleSection module={module} titleId={titleId} dataTestId={dataTestId}>
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
