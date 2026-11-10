import type {
  IWithDataTestId,
  TContentAlignment,
  TMaybeUndefined,
} from '@blog/config';
import type { IWithChildren } from '@blog/config/react';
import { ModuleHeading } from '@web/components/shared/module-heading';
import type { IModuleHeadingProps } from '@web/components/shared/module-heading/module-heading';
import { Section } from '@web/components/shared/section';
import type { ISectionProps } from '@web/components/shared/section/section';

type TModuleSectionModule = Pick<ISectionProps, 'brandVariant' | 'layout'> &
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
  const { brandVariant, layout, headingBlock, contentAlignment } = module;

  return (
    <Section
      brandVariant={brandVariant}
      layout={layout}
      titleId={titleId}
      dataTestId={dataTestId}
    >
      <ModuleHeading
        headingBlock={headingBlock}
        id={titleId}
        level={2}
        align={contentAlignment}
        variant="section"
      />
      {children}
    </Section>
  );
};
