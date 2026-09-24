import { DISPLAY_MODE } from '@blog/config';
import type { TLogoWallModule } from '@blog/service';
import { ActionGroup } from '@web/components/shared/action-group';
import { ModuleHeading } from '@web/components/shared/module-heading';
import { Section } from '@web/components/shared/section';
import { moduleGridActionsVariants } from '@web/utils/module-grid-actions-variants';

import { LogoWallCarousel } from './components/logo-wall-carousel/logo-wall-carousel';
import { LogoWallTile } from './components/logo-wall-tile/logo-wall-tile';
import { logoWallModuleViewVariants } from './logo-wall-module-view-variants';

export interface ILogoWallModuleViewProps extends TLogoWallModule {
  titleId: string;
  dataTestId: string;
}

export const LogoWallModuleView = ({
  brandVariant,
  headingBlock,
  logos,
  ctaButtons,
  displayMode,
  contentAlignment,
  layout,
  titleId,
  dataTestId,
}: ILogoWallModuleViewProps) => {
  if (logos.length === 0) return null;

  const s = moduleGridActionsVariants({ align: contentAlignment });

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
      {displayMode === DISPLAY_MODE.CAROUSEL ? (
        <LogoWallCarousel
          logos={logos}
          title={headingBlock.heading}
          tone={brandVariant}
        />
      ) : (
        <div
          className={logoWallModuleViewVariants({ align: contentAlignment })}
          data-testid={`${dataTestId}-grid`}
        >
          {logos.map((logo) => (
            <LogoWallTile key={logo.id} logo={logo} />
          ))}
        </div>
      )}
      {ctaButtons.length > 0 && (
        <div className={s.actions()}>
          <ActionGroup actions={ctaButtons} />
        </div>
      )}
    </Section>
  );
};
