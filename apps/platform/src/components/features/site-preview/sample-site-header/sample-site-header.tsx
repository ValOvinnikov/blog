import {
  HEADER_LAYOUT,
  SIZE,
  type TLocaleIsoCode,
  type TMaybeUndefined,
} from '@blog/config';
import { BrandMark } from '@blog/ui/components/atoms/brand-mark';
import { SampleHeaderControls } from '@platform/components/features/site-preview/sample-site-header/components/sample-header-controls/sample-header-controls';
import { SampleHeaderLinks } from '@platform/components/features/site-preview/sample-site-header/components/sample-header-links/sample-header-links';
import {
  SAMPLE_HEADER_BAR_STYLE_ATTRIBUTE,
  SAMPLE_HEADER_LAYOUT_ATTRIBUTE,
  SAMPLE_HEADER_TEST_ID,
} from '@platform/constants/sample-header';
import type { TSampleHeaderStyle } from '@platform/utils/sample-header-style/sample-header-style';

import { sampleSiteHeaderVariants } from './sample-site-header-variants';

type TSampleBrand = {
  name: string;
  logoSrc: TMaybeUndefined<string>;
};

export type TSampleSiteHeaderProps = {
  brand: TSampleBrand;
  liveLocales: readonly TLocaleIsoCode[];
  header: TSampleHeaderStyle;
  hasReaderAccounts: boolean;
  isSignedIn: boolean;
  isNarrow: boolean;
  isDark: boolean;
  isSubmenuOpen: boolean;
};

export const SampleSiteHeader = ({
  brand: { name, logoSrc },
  liveLocales,
  header,
  hasReaderAccounts,
  isSignedIn,
  isNarrow,
  isDark,
  isSubmenuOpen,
}: TSampleSiteHeaderProps) => {
  const { layout, submenuStyle, barStyle, languageSwitcherStyle, account } =
    header;
  const { root, inner, group, links, controls, brand, brandName } =
    sampleSiteHeaderVariants({
      isNarrow,
      barStyle,
      layout: isNarrow ? undefined : layout,
    });
  const hasLinks = !isNarrow && layout !== HEADER_LAYOUT.MENU_BUTTON;
  const hasMenuButton = isNarrow || layout === HEADER_LAYOUT.MENU_BUTTON;

  return (
    <header
      className={root()}
      data-testid={SAMPLE_HEADER_TEST_ID}
      {...{
        [SAMPLE_HEADER_LAYOUT_ATTRIBUTE]: layout,
        [SAMPLE_HEADER_BAR_STYLE_ATTRIBUTE]: barStyle,
      }}
    >
      <div className={inner()}>
        <div className={brand()}>
          <BrandMark size={SIZE.SM} title={name} src={logoSrc} />
          <span className={brandName()}>{name}</span>
        </div>
        <div className={group()}>
          {hasLinks && (
            <SampleHeaderLinks
              submenuStyle={submenuStyle}
              isSubmenuOpen={isSubmenuOpen}
              className={links()}
            />
          )}
          <SampleHeaderControls
            liveLocales={liveLocales}
            languageSwitcherStyle={languageSwitcherStyle}
            account={account}
            hasReaderAccounts={hasReaderAccounts}
            isSignedIn={isSignedIn}
            isDark={isDark}
            isNarrow={isNarrow}
            hasMenuButton={hasMenuButton}
            className={controls()}
          />
        </div>
      </div>
    </header>
  );
};
