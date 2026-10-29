import {
  FOOTER_LAYOUT,
  type IWithClassName,
  type IWithDataTestId,
} from '@blog/config';
import {
  mapCompoundSlots,
  type TCompoundChildren,
  type TCompoundComponent,
} from '@blog/ui/lib/react';
import { Fragment, type ElementType } from 'react';

import { FooterAbout } from './components/about/footer-about';
import { FooterAddress } from './components/address/footer-address';
import { FooterCopyright } from './components/copyright/footer-copyright';
import { FooterFinePrint } from './components/fine-print/footer-fine-print';
import { FooterGroup } from './components/group/footer-group';
import { FooterGroups } from './components/groups/footer-groups';
import { FooterLogo } from './components/logo/footer-logo';
import { FooterNav } from './components/nav/footer-nav';
import { FooterSocial } from './components/social/footer-social';
import { FooterWordmark } from './components/wordmark/footer-wordmark';
import { footerVariants, type TFooterVariants } from './footer-variants';

const FooterSlotParts = {
  Logo: FooterLogo,
  About: FooterAbout,
  Address: FooterAddress,
  Social: FooterSocial,
  Groups: FooterGroups,
  Wordmark: FooterWordmark,
  Copyright: FooterCopyright,
  FinePrint: FooterFinePrint,
  Nav: FooterNav,
} satisfies Record<string, ElementType>;

const FooterParts = {
  ...FooterSlotParts,
  Group: FooterGroup,
} satisfies Record<string, ElementType>;

export type TFooterProps = IWithClassName &
  IWithDataTestId & {
    layout?: TFooterVariants['layout'];
    surface?: TFooterVariants['surface'];
    tone?: TFooterVariants['tone'];
    children?: TCompoundChildren<typeof FooterSlotParts>;
  };

/** The site footer: a brand column, named link groups and a fine-print row, arranged by `layout`, set full width or as a card by `surface`, on the skin `tone` picks. */
const FooterRoot = ({
  layout = FOOTER_LAYOUT.COLUMNS,
  surface,
  tone,
  children,
  className,
  dataTestId,
}: TFooterProps) => {
  const { slots, unmatched } = mapCompoundSlots(children, FooterSlotParts);
  const isCompact = layout === FOOTER_LAYOUT.COMPACT;
  const logo = isCompact ? undefined : slots.Logo;
  const about = isCompact ? undefined : slots.About;
  const address = isCompact ? undefined : slots.Address;
  const groups = isCompact ? undefined : slots.Groups;
  const wordmark =
    layout === FOOTER_LAYOUT.BIG_WORDMARK ? slots.Wordmark : undefined;
  const hasBrand = Boolean(logo || about || address || slots.Social);
  const hasMain = hasBrand || Boolean(groups);
  const hasBottom = Boolean(slots.Copyright || slots.FinePrint || slots.Nav);
  const { root, inner, main, brand, bottom } = footerVariants({
    layout,
    surface,
    tone,
    isDivided: !isCompact && (hasMain || Boolean(wordmark)),
  });

  return (
    <footer
      className={root({ class: className })}
      data-layout={layout}
      data-testid={dataTestId}
    >
      <div className={inner()}>
        {hasMain && (
          <div className={main()}>
            {hasBrand && (
              <div className={brand()}>
                {logo}
                {about}
                {address}
                {slots.Social}
              </div>
            )}
            {groups}
          </div>
        )}
        {wordmark}
        {hasBottom && (
          <div className={bottom()}>
            {slots.Copyright}
            {slots.FinePrint}
            {slots.Nav}
          </div>
        )}
        {unmatched.map((node, i) => (
          <Fragment key={i}>{node}</Fragment>
        ))}
      </div>
    </footer>
  );
};

export const Footer: TCompoundComponent<typeof FooterRoot, typeof FooterParts> =
  Object.assign(FooterRoot, FooterParts);
