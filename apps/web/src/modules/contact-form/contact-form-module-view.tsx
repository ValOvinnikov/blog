import type { TContactFormModule } from '@blog/service';
import { ModuleHeading } from '@web/components/shared/module-heading';
import { PortableText } from '@web/components/shared/portable-text';
import { Section } from '@web/components/shared/section';
import { ContactForm } from '@web/modules/contact-form/components/contact-form/contact-form';
import type { TContactFormLocales } from '@web/modules/contact-form/hooks/use-contact-form/use-contact-form';
import { useId } from 'react';

import { contactFormModuleViewVariants } from './contact-form-module-view-variants';

export interface IContactFormModuleViewProps
  extends TContactFormModule, TContactFormLocales {
  id: string;
}

export const ContactFormModuleView = ({
  id,
  brandVariant,
  headingBlock,
  successMessage,
  privacyNote,
  layout,
  contentAlignment,
  currentLocale,
  defaultLocale,
}: IContactFormModuleViewProps) => {
  const titleId = useId();
  const s = contactFormModuleViewVariants({ align: contentAlignment });

  return (
    <Section
      brandVariant={brandVariant}
      layout={layout}
      titleId={titleId}
      dataTestId={`contact-form-module-${id}`}
    >
      <ModuleHeading
        headingBlock={headingBlock}
        id={titleId}
        level={2}
        align={contentAlignment}
        variant="section"
      />
      <div className={s.column()}>
        <ContactForm
          successMessage={successMessage}
          currentLocale={currentLocale}
          defaultLocale={defaultLocale}
          privacyNote={
            privacyNote ? <PortableText value={privacyNote} /> : undefined
          }
        />
      </div>
    </Section>
  );
};
