import {
  HEADER_BAR_STYLE,
  HEADER_LAYOUT,
  SIZE,
  type TLocaleIsoCode,
  type TMaybeUndefined,
} from '@blog/config';
import { BrandMark } from '@blog/ui/components/atoms/brand-mark';
import { SampleHeaderControls } from '@platform/components/features/site-preview/look-sample/components/sample-site-header/components/sample-header-controls/sample-header-controls';
import { SampleHeaderLinks } from '@platform/components/features/site-preview/look-sample/components/sample-site-header/components/sample-header-links/sample-header-links';
import type { TSampleHeaderStyle } from '@platform/utils/sample-header-style/sample-header-style';
import { tv } from '@platform/utils/tv/tv';

const sampleSiteHeaderVariants = tv({
  slots: {
    root: ['relative'],
    inner: ['items-center gap-3'],
    group: [],
    links: [],
    controls: [],
    brand: ['flex items-center gap-2'],
    brandName: ['font-display text-base font-semibold text-text'],
  },
  variants: {
    isNarrow: {
      true: {
        inner: ['flex flex-nowrap justify-between'],
        brand: ['min-w-0'],
        brandName: ['truncate'],
      },
      false: {},
    },
    barStyle: {
      [HEADER_BAR_STYLE.FULL_WIDTH]: {
        root: ['border-b border-border pb-3'],
      },
      [HEADER_BAR_STYLE.FLOATING]: {
        root: [
          'rounded-card border border-border bg-primary px-3 py-2.5 shadow-float',
        ],
      },
    },
    layout: {
      [HEADER_LAYOUT.CLASSIC]: {
        inner: ['flex flex-wrap justify-between'],
        group: ['flex items-center gap-4'],
      },
      [HEADER_LAYOUT.LINKS_BESIDE_BRAND]: {
        inner: ['grid grid-cols-[auto_1fr_auto] gap-x-6'],
        group: ['contents'],
      },
      [HEADER_LAYOUT.CENTRED_LINKS]: {
        inner: ['grid grid-cols-[1fr_auto_1fr] gap-x-6'],
        group: ['contents'],
        controls: ['justify-self-end'],
      },
      [HEADER_LAYOUT.TWO_ROWS]: {
        inner: ['grid grid-cols-[1fr_auto] gap-x-6'],
        group: ['contents'],
        links: ['col-span-full row-start-2 border-t border-border pt-3'],
        controls: ['justify-self-end'],
      },
      [HEADER_LAYOUT.CENTRED_BRAND]: {
        inner: ['grid grid-cols-[1fr_auto_1fr] gap-x-6'],
        group: ['contents'],
        links: ['col-start-1 row-start-1'],
        controls: ['col-start-3 row-start-1 justify-self-end'],
      },
      [HEADER_LAYOUT.MENU_BUTTON]: {
        inner: ['flex flex-wrap justify-between'],
        group: ['flex items-center gap-4'],
      },
    },
  },
});

export type TSampleSiteHeaderProps = {
  tenantName: string;
  logoSrc: TMaybeUndefined<string>;
  liveLocales: readonly TLocaleIsoCode[];
  header: TSampleHeaderStyle;
  hasReaderAccounts: boolean;
  isNarrow: boolean;
  isDark: boolean;
};

export const SampleSiteHeader = ({
  tenantName,
  logoSrc,
  liveLocales,
  header,
  hasReaderAccounts,
  isNarrow,
  isDark,
}: TSampleSiteHeaderProps) => {
  const { layout, submenuStyle, barStyle, languageSwitcherStyle } = header;
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
      data-testid="sample-site-header"
      data-header-layout={layout}
      data-header-bar-style={barStyle}
    >
      <div className={inner()}>
        <div className={brand()}>
          <BrandMark size={SIZE.SM} title={tenantName} src={logoSrc} />
          <span className={brandName()}>{tenantName}</span>
        </div>
        <div className={group()}>
          {hasLinks && (
            <SampleHeaderLinks
              submenuStyle={submenuStyle}
              className={links()}
            />
          )}
          <SampleHeaderControls
            liveLocales={liveLocales}
            languageSwitcherStyle={languageSwitcherStyle}
            hasReaderAccounts={hasReaderAccounts}
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
