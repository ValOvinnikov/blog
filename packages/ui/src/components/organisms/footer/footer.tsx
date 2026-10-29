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

import { FooterGroup } from './components/group/footer-group';
import { FooterGroupItem } from './components/group-item/footer-group-item';
import {
  BOTTOM_SLOTS,
  BRAND_SLOTS,
  FooterSlotParts,
  LAYOUT_SLOTS,
  SLOT_HAS_CONTENT,
} from './footer-slots';
import { footerVariants, type TFooterVariants } from './footer-variants';

const FooterParts = {
  ...FooterSlotParts,
  Group: FooterGroup,
  GroupItem: FooterGroupItem,
} satisfies Record<string, ElementType>;

export type TFooterProps = IWithClassName &
  IWithDataTestId & {
    layout?: TFooterVariants['layout'];
    surface?: TFooterVariants['surface'];
    tone?: TFooterVariants['tone'];
    children?: TCompoundChildren<typeof FooterSlotParts>;
  };

/** The public site's footer, where readers find the site's links, contact details and legal fine print. */
const FooterRoot = ({
  layout = FOOTER_LAYOUT.COLUMNS,
  surface,
  tone,
  children,
  className,
  dataTestId,
}: TFooterProps) => {
  const { slots, unmatched } = mapCompoundSlots(children, FooterSlotParts);
  const shown = LAYOUT_SLOTS[layout].filter((key) =>
    SLOT_HAS_CONTENT[key](slots[key]),
  );
  const isShown = (key: keyof typeof FooterSlotParts) => shown.includes(key);
  const hasBrand = BRAND_SLOTS.some(isShown);
  const hasMain = hasBrand || isShown('Groups');
  const hasBottom = BOTTOM_SLOTS.some(isShown);
  const isDivided =
    layout !== FOOTER_LAYOUT.COMPACT &&
    hasBottom &&
    (hasMain || isShown('Wordmark'));
  const { root, inner, main, brand, divider, bottom } = footerVariants({
    layout,
    surface,
    tone,
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
                {BRAND_SLOTS.filter(isShown).map((key) => (
                  <Fragment key={key}>{slots[key]}</Fragment>
                ))}
              </div>
            )}
            {isShown('Groups') && slots.Groups}
          </div>
        )}
        {isShown('Wordmark') && slots.Wordmark}
        {isDivided && <hr className={divider()} />}
        {hasBottom && (
          <div className={bottom()}>
            {BOTTOM_SLOTS.filter(isShown).map((key) => (
              <Fragment key={key}>{slots[key]}</Fragment>
            ))}
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
