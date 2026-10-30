import type { TBrandVariant, THeadingBlock, TLayout } from '@blog/config';
import { ModuleHeading } from '@web/components/shared/module-heading';
import { Section } from '@web/components/shared/section';

import { CookieSettingsForm } from './components/cookie-settings-form/cookie-settings-form';
import { cookieSettingsModuleViewVariants } from './cookie-settings-module-view-variants';

export interface ICookieSettingsModuleViewProps {
  id: string;
  brandVariant: TBrandVariant;
  headingBlock: THeadingBlock;
  layout?: TLayout;
}

const s = cookieSettingsModuleViewVariants();

export const CookieSettingsModuleView = ({
  id,
  brandVariant,
  headingBlock,
  layout,
}: ICookieSettingsModuleViewProps) => {
  const titleId = `cookie-settings-${id}`;

  return (
    <Section
      brandVariant={brandVariant}
      layout={layout}
      titleId={titleId}
      dataTestId={`cookie-settings-module-${id}`}
    >
      <div className={s.wrapper()}>
        <ModuleHeading
          headingBlock={headingBlock}
          id={titleId}
          level={2}
          variant="section"
        />
        <CookieSettingsForm />
      </div>
    </Section>
  );
};
