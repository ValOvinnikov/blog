import { SampleHeaderBar } from '@platform/components/features/site-preview/sample-site-header/components/sample-header-bar/sample-header-bar';
import { SampleHeaderBrand } from '@platform/components/features/site-preview/sample-site-header/components/sample-header-brand/sample-header-brand';
import { SampleHeaderControls } from '@platform/components/features/site-preview/sample-site-header/components/sample-header-controls/sample-header-controls';
import { SampleHeaderLinks } from '@platform/components/features/site-preview/sample-site-header/components/sample-header-links/sample-header-links';
import {
  SAMPLE_HEADER_BAR_STYLE_ATTRIBUTE,
  SAMPLE_HEADER_FULL_TEST_ID,
  SAMPLE_HEADER_LAYOUT_ATTRIBUTE,
  SAMPLE_HEADER_TEST_ID,
} from '@platform/constants/sample-header';
import { SAMPLE_PART } from '@platform/constants/sample-part';
import type { TSampleHeaderStyle } from '@platform/utils/sample-header-style/sample-header-style';
import {
  HEADER_LAYOUT,
  HEADER_SUBMENU_STYLE,
  type TLocaleIsoCode,
  type TMaybeUndefined,
} from '@shinefold/config';

import type { TSampleReader } from './sample-reader';
import { sampleSiteHeaderVariants } from './sample-site-header-variants';

type TSampleBrand = {
  name: string;
  logoSrc: TMaybeUndefined<string>;
};

export type TSampleSiteHeaderProps = {
  brand: TSampleBrand;
  liveLocales: readonly TLocaleIsoCode[];
  header: TSampleHeaderStyle;
  reader: TSampleReader;
  isDark: boolean;
  isSubmenuOpen: boolean;
  shouldAlwaysShowLanguageSwitcher?: boolean;
};

export const SampleSiteHeader = ({
  brand: { name, logoSrc },
  liveLocales,
  header,
  reader,
  isDark,
  isSubmenuOpen,
  shouldAlwaysShowLanguageSwitcher = false,
}: TSampleSiteHeaderProps) => {
  const { layout, submenuStyle, barStyle, background, account } = header;
  const { root, full, bar, group, links, controls } = sampleSiteHeaderVariants({
    barStyle,
    layout,
    isWidePanelOpen:
      isSubmenuOpen && submenuStyle === HEADER_SUBMENU_STYLE.WIDE_PANEL,
  });

  return (
    <header
      className={root()}
      data-skin={background}
      data-testid={SAMPLE_HEADER_TEST_ID}
      data-part={SAMPLE_PART.HEADER}
      {...{
        [SAMPLE_HEADER_LAYOUT_ATTRIBUTE]: layout,
        [SAMPLE_HEADER_BAR_STYLE_ATTRIBUTE]: barStyle,
      }}
    >
      <div className={full()} data-testid={SAMPLE_HEADER_FULL_TEST_ID}>
        <SampleHeaderBrand name={name} logoSrc={logoSrc} />
        <div className={group()}>
          {layout !== HEADER_LAYOUT.MENU_BUTTON && (
            <SampleHeaderLinks
              submenuStyle={submenuStyle}
              isSubmenuOpen={isSubmenuOpen}
              className={links()}
            />
          )}
          <SampleHeaderControls
            liveLocales={liveLocales}
            header={header}
            reader={reader}
            isDark={isDark}
            shouldAlwaysShowLanguageSwitcher={shouldAlwaysShowLanguageSwitcher}
            className={controls()}
          />
        </div>
      </div>
      <SampleHeaderBar
        brand={{ name, logoSrc }}
        account={account}
        reader={reader}
        className={bar()}
      />
    </header>
  );
};
