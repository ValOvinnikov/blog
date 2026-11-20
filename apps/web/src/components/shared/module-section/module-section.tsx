import type {
  IWithDataTestId,
  TContentAlignment,
  TMaybeUndefined,
} from '@shinefold/config';
import type { IWithChildren } from '@shinefold/config/react';
import { ModuleHeading } from '@web/components/shared/module-heading';
import type { IModuleHeadingProps } from '@web/components/shared/module-heading/module-heading';
import { Section, type TModuleSection } from '@web/components/shared/section';

type TModuleSectionModule = TModuleSection &
  Pick<IModuleHeadingProps, 'headingBlock'> & {
    contentAlignment: TMaybeUndefined<TContentAlignment>;
  };

export interface IModuleSectionProps extends IWithDataTestId, IWithChildren {
  module: TModuleSectionModule;
  titleId: string;
}

export const ModuleSection = ({
  module,
  titleId,
  dataTestId,
  children,
}: IModuleSectionProps) => {
  const { brandVariant, layout, appearance, headingBlock, contentAlignment } =
    module;

  return (
    <Section
      brandVariant={brandVariant}
      layout={layout}
      appearance={appearance}
      titleId={titleId}
      dataTestId={dataTestId}
    >
      <ModuleHeading
        headingBlock={headingBlock}
        id={titleId}
        level={2}
        align={contentAlignment}
      />
      {children}
    </Section>
  );
};
