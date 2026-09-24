import type { TFaqModule } from '@blog/service';
import { Accordion } from '@blog/ui/components/organisms/accordion';
import { ActionGroup } from '@web/components/shared/action-group';
import { ModuleHeading } from '@web/components/shared/module-heading';
import { PortableText } from '@web/components/shared/portable-text';
import { Section } from '@web/components/shared/section';
import { moduleGridActionsVariants } from '@web/utils/module-grid-actions-variants';

import { faqModuleViewVariants } from './faq-module-view-variants';

export interface IFaqModuleViewProps extends TFaqModule {
  titleId: string;
  dataTestId: string;
}

export const FaqModuleView = ({
  brandVariant,
  headingBlock,
  questions,
  ctaButtons,
  contentAlignment,
  layout,
  titleId,
  dataTestId,
}: IFaqModuleViewProps) => {
  if (questions.length === 0) return null;

  const s = faqModuleViewVariants({ align: contentAlignment });
  const actions = moduleGridActionsVariants({ align: contentAlignment });

  return (
    <Section
      brandVariant={brandVariant}
      layout={layout}
      titleId={titleId}
      dataTestId={dataTestId}
    >
      <div className={s.wrapper()}>
        <ModuleHeading
          headingBlock={headingBlock}
          id={titleId}
          level={2}
          align={contentAlignment}
          variant="section"
        />
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
        {ctaButtons.length > 0 && (
          <div className={actions.actions()}>
            <ActionGroup actions={ctaButtons} />
          </div>
        )}
      </div>
    </Section>
  );
};
