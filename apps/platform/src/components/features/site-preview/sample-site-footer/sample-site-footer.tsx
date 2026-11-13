import { ICONS, SIZE } from '@blog/config';
import { BrandMark } from '@blog/ui/components/atoms/brand-mark';
import { Icon } from '@blog/ui/components/atoms/icon';
import { TextLink } from '@blog/ui/components/atoms/text-link';
import { Footer } from '@blog/ui/components/organisms/footer';
import { isUndefined } from '@blog/utils/primitives';
import { SamplePart } from '@platform/components/features/site-preview/sample-part';
import type { TSampleSiteHeaderProps } from '@platform/components/features/site-preview/sample-site-header';
import {
  SAMPLE_FOOTER_PART_TEST_ID,
  SAMPLE_FOOTER_TEST_ID,
} from '@platform/constants/sample-footer';
import { SAMPLE_PART } from '@platform/constants/sample-part';
import { usePoweredByProductName } from '@platform/context/powered-by-mark-provider';
import type { TSampleFooterStyle } from '@platform/utils/sample-footer-style/sample-footer-style';
import { useTranslations } from 'next-intl';

type TSampleSiteFooterProps = {
  brand: TSampleSiteHeaderProps['brand'];
  footer: TSampleFooterStyle;
};

export const SampleSiteFooter = ({
  brand: { name, logoSrc },
  footer: { layout, tone, surface, hasCookieSettingsLink },
}: TSampleSiteFooterProps) => {
  const t = useTranslations('lookPreview');
  const poweredByProductName = usePoweredByProductName();

  const groups = [
    {
      heading: t('footerReadHeading'),
      links: [t('footerArchive'), t('footerRss')],
    },
    {
      heading: t('footerSiteHeading'),
      links: [t('footerTeam'), t('footerContact')],
    },
  ];

  return (
    <div
      data-part={SAMPLE_PART.FOOTER}
      data-testid={SAMPLE_FOOTER_PART_TEST_ID}
    >
      <Footer
        layout={layout}
        tone={tone}
        surface={surface}
        dataTestId={SAMPLE_FOOTER_TEST_ID}
      >
        <Footer.Logo>
          <SamplePart part={SAMPLE_PART.BRAND}>
            <BrandMark
              size={SIZE.SM}
              title={name}
              siteName={name}
              src={logoSrc}
            />
          </SamplePart>
        </Footer.Logo>
        <Footer.About>{t('footerAbout')}</Footer.About>
        <Footer.Groups ariaLabel={t('footerGroupsAriaLabel')}>
          {groups.map(({ heading, links }) => (
            <Footer.Group key={heading} heading={heading} headingLevel={4}>
              {links.map((label) => (
                <Footer.GroupItem key={label}>
                  <TextLink appearance="nav" href="#">
                    {label}
                  </TextLink>
                </Footer.GroupItem>
              ))}
            </Footer.Group>
          ))}
        </Footer.Groups>
        <Footer.Wordmark>{name}</Footer.Wordmark>
        <Footer.Copyright title={name} year={new Date().getFullYear()} />
        <Footer.FinePrint ariaLabel={t('footerFinePrintAriaLabel')}>
          <TextLink appearance="nav" href="#">
            {t('footerPrivacy')}
          </TextLink>
          {hasCookieSettingsLink && (
            <TextLink appearance="nav" href="#">
              <Icon name={ICONS.COOKIE} size={SIZE.SM} />
              {t('footerCookieSettings')}
            </TextLink>
          )}
        </Footer.FinePrint>
        {!isUndefined(poweredByProductName) && (
          <Footer.PoweredBy
            label={t('footerPoweredByLabel')}
            productName={poweredByProductName}
            href="#"
          />
        )}
      </Footer>
    </div>
  );
};
